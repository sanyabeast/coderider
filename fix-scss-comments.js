const fs = require('fs');
const path = require('path');

// List of files with comment issues
const filesToFix = [
  'res/sass/material-overrides.scss',
  'res/sass/app.scss',
  'res/sass/fonts.scss',
  'res/sass/wonderland.scss'
];

const baseDir = process.cwd();

// Function to remove single-line comments that are causing issues
function fixCssComments(content) {
  // Replace single-line comments with empty lines
  return content.replace(/\s*\/\/.*$/gm, '');
}

// Fix each file
filesToFix.forEach(file => {
  const filePath = path.join(baseDir, file);
  try {
    if (fs.existsSync(filePath)) {
      console.log(`Fixing comments in ${file}...`);
      const content = fs.readFileSync(filePath, 'utf8');
      const fixedContent = fixCssComments(content);
      fs.writeFileSync(filePath, fixedContent);
      console.log(`Fixed ${file}`);
    } else {
      console.log(`File not found: ${file}`);
    }
  } catch (err) {
    console.error(`Error processing ${file}: ${err.message}`);
  }
});

console.log('All SCSS files processed');
