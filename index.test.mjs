import { limon } from './index.js';
import test from 'ava';

test("convert", t => {
  t.is(limon("ភស្តុតាងអំពីពាក្យថា ខ្មែរ"), "PsþútagGMBIBaküfa Exµr");
  t.is(limon("សម្រាប់ស្បែកខ្មៅ"), 'sRmab;Es,kexµA');
  t.is(limon("សម្រាប់ស្បែកខ្មៅ,"), 'sRmab;Es,kexµA,');
  t.is(limon("ស៊ាន"), 's‘an');
  
  t.is(limon("ការឲ្យ"), 'kar[');
  t.is(limon("ការឱ្យ"), 'kar[');
  t.is(limon("ការឱ"), 'kar»');
  t.is(limon("ការឲ"), 'kar»');
  t.is(limon("ឲ"), '»');
  t.is(limon("ឲ្យ"), '[');
  t.is(limon("ឱ្យ"), '[');
  t.is(limon("ឱ"), '»');
  t.is(limon("ស៊ី"), 'suI');
  
  t.is(limon("អ៊ី"), 'GuI');
  t.is(limon("អ៊ឺ"), 'GuW');
  t.is(limon("អ៊ឹ"), 'Guw');
  t.is(limon("អ៊ិ"), 'Gui');

  t.is(limon("ស៊ើប"), 'esuIb');
  t.is(limon("ប៉ី"), 'buI');
  t.is(limon("ប៉ិ"), 'bui');
  t.is(limon("ប៉ឹ"), 'buw');
  t.is(limon("ប៉ឺ"), 'buW');
})
