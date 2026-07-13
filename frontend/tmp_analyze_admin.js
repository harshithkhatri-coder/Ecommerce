const fs = require('fs');
const path = 'frontend/src/Admin.jsx';
const text = fs.readFileSync(path, 'utf8');
const lines = text.split(/\r?\n/);
const tags = ['<div','</div>','<button','</button>','<form','</form>','<span','</span>','<select','</select>','<textarea','</textarea>'];
for (const tag of tags) {
  console.log(tag, (text.match(new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length);
}

let divCount = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const opens = (line.match(/<div(\s|>)/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  divCount += opens - closes;
  if (divCount < 0) {
    console.log('DIV NEGATIVE at', i+1, line.trim());
    break;
  }
}
console.log('final div balance', divCount);

let formCount = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  formCount += (line.match(/<form(\s|>)/g) || []).length;
  formCount -= (line.match(/<\/form>/g) || []).length;
  if (formCount < 0) {
    console.log('FORM NEGATIVE at', i+1, line.trim());
    break;
  }
}
console.log('final form balance', formCount);
