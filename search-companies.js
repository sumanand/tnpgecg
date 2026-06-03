import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

const searchFiles = (dir) => {
  const files = readdirSync(dir);
  files.forEach(file => {
    const fullPath = join(dir, file);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      searchFiles(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = readFileSync(fullPath, 'utf8');
      if (content.includes('companies') || content.includes('status: \'pending\'') || content.includes('status: "pending"')) {
        console.log(`Found in: ${fullPath}`);
        // Log import or function if found
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('companies') || line.includes('status') || line.includes('approve')) {
            console.log(`  L${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  });
};

searchFiles(join(process.cwd(), 'src'));
