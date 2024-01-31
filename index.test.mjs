import { limon } from './index.js';
import test from 'ava';

test("convert", t => {
  t.is(limon("ភស្តុតាងអំពីពាក្យថា ខ្មែរ"), "PsþútagGMBIBaküfa Exµr")
  t.is(limon("សម្រាប់ស្បែកខ្មៅ"), 'sRmab;Es,kexµA')
  t.is(limon("សម្រាប់ស្បែកខ្មៅ,"), 'sRmab;Es,kexµA,')
})