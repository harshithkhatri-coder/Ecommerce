const fs = require('fs');
const text = fs.readFileSync('frontend/src/Admin.jsx', 'utf8');
const lines = text.split(/\r?\n/);
function countTag(tag) { return (text.match(new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length; }
const tags = ['<div', '</div>', '<button', '</button>', '<form', '</form>', '<span', '</span>', '<select', '</select>', '<textarea', '</textarea>', '<input', '<img', '<video'];
tags.forEach(tag => console.log(tag, countTag(tag)));
let div=0; let form=0; let textarea=0;
for (let i=0;i<lines.length;i++) {
  div += (lines[i].match(/<div(\s|>)/g)||[]).length;
  div -= (lines[i].match(/<\/div>/g)||[]).length;
  if (div<0) console.log('DIV NEGATIVE', i+1, lines[i]);
  form += (lines[i].match(/<form(\s|>)/g)||[]).length;
  form -= (lines[i].match(/<\/form>/g)||[]).length;
  if (form<0) console.log('FORM NEGATIVE', i+1, lines[i]);
  textarea += (lines[i].match(/<textarea/g)||[]).length;
  textarea -= (lines[i].match(/<\/textarea>/g)||[]).length;
  if (textarea<0) console.log('TEXTAREA NEGATIVE', i+1, lines[i]);
}
console.log('final div', div,'final form', form,'final textarea', textarea);
