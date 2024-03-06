import {
  AddressPrefix,
  addressToScript,
  getTransactionSize,
  privateKeyToAddress,
  serializeWitnessArgs,
} from '@nervosnetwork/ckb-sdk-utils';
import { ConstructParams } from '../types/transfer';
import { NoLiveCellError } from '../error';
import { CKB_UNIT, MAX_FEE, getSecp256k1CellDep } from '../constants';
import { append0x } from '../utils';
import { calculateTransactionFee } from '../utils/ckb-tx';

const SECP256K1_MIN_CAPACITY = BigInt(61) * CKB_UNIT;
const SECP256K1_WITNESS_LOCK_LEN = 65;

export const splitMultiCellsWithSecp256k1 = async ({
  masterPrivateKey,
  collector,
  receiverAddress,
  capacityWithCKB,
  cellAmount,
}: ConstructParams) => {
  const isMainnet = receiverAddress.startsWith('ckb');
  const masterAddress = privateKeyToAddress(masterPrivateKey, {
    prefix: isMainnet ? AddressPrefix.Mainnet : AddressPrefix.Testnet,
  });
  const masterLock = addressToScript(masterAddress);

  const emptyCells = await collector.getCells({
    lock: masterLock,
  });
  if (!emptyCells || emptyCells.length === 0) {
    throw new NoLiveCellError('The address has no empty cells');
  }

  const cellCapacity = BigInt(capacityWithCKB) * CKB_UNIT;
  const needCapacity = cellCapacity * BigInt(cellAmount);
  let txFee = MAX_FEE;
  const { inputs, capacity: emptyInputsCapacity } = collector.collectInputs(
    emptyCells,
    needCapacity,
    txFee,
    SECP256K1_MIN_CAPACITY,
  );

  const outputs: CKBComponents.CellOutput[] = new Array(cellAmount).fill({
    lock: addressToScript(receiverAddress),
    capacity: append0x(cellCapacity.toString(16)),
  });

  const changeCapacity = emptyInputsCapacity - needCapacity - txFee;
  outputs.push({
    lock: masterLock,
    capacity: append0x(changeCapacity.toString(16)),
  });
  const outputsData = new Array(cellAmount + 1).fill('0x');

  const emptyWitness = { lock: '', inputType: '', outputType: '' };
  const witnesses = inputs.map((_, index) => (index === 0 ? emptyWitness : '0x'));

  const cellDeps = [getSecp256k1CellDep(isMainnet)];

  const unsignedTx = {
    version: '0x0',
    cellDeps,
    headerDeps: [],
    inputs,
    outputs,
    outputsData,
    witnesses,
  };

  if (txFee === MAX_FEE) {
    const txSize = getTransactionSize(unsignedTx) + SECP256K1_WITNESS_LOCK_LEN;
    const estimatedTxFee = calculateTransactionFee(txSize);
    const estimatedChangeCapacity = changeCapacity + (MAX_FEE - estimatedTxFee);
    unsignedTx.outputs[unsignedTx.outputs.length - 1].capacity = append0x(estimatedChangeCapacity.toString(16));
  }

  const signedTx = collector.getCkb().signTransaction(masterPrivateKey)(unsignedTx);
  const txHash = await collector.getCkb().rpc.sendTransaction(signedTx, 'passthrough');

  console.info(`Paymaster cells has been split and tx hash is ${txHash}`);
};
