// This file is generated by @ckb-lumos/molecule, please do not modify it manually.
/* eslint-disable */

import { bytes, createBytesCodec, createFixedBytesCodec, molecule } from '@ckb-lumos/codec';
import { Byte32, Script, Bytes } from './blockchain';
import { Uint32 } from './customized';

const { array, vector, union, option, struct, table } = molecule;

const fallbackBytesCodec = createBytesCodec({
  pack: bytes.bytify,
  unpack: bytes.hexify,
});

function createFallbackFixedBytesCodec(byteLength: number) {
  return createFixedBytesCodec({
    pack: bytes.bytify,
    unpack: bytes.hexify,
    byteLength,
  });
}

const byte = createFallbackFixedBytesCodec(1);

export const RGBPPConfig = struct(
  {
    btcLcTypeHash: Byte32,
    btcTimeLockTypeHash: Byte32,
  },
  ['btcLcTypeHash', 'btcTimeLockTypeHash'],
);

export const RGBPPLock = struct(
  {
    outIndex: Uint32,
    btcTxid: Byte32,
  },
  ['outIndex', 'btcTxid'],
);

export const ExtraCommitmentData = struct(
  {
    inputLen: byte,
    outputLen: byte,
  },
  ['inputLen', 'outputLen'],
);

export const Uint16 = createFallbackFixedBytesCodec(2);

export const RGBPPUnlock = table(
  {
    version: Uint16,
    extraData: ExtraCommitmentData,
    btcTx: Bytes,
  },
  ['version', 'extraData', 'btcTx'],
);

export const BTCTimeLock = table(
  {
    lockScript: Script,
    after: Uint32,
    btcTxid: Byte32,
  },
  ['lockScript', 'after', 'btcTxid'],
);
