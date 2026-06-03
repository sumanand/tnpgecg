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
      if (content.includes('companys') || content.includes('role + \'s\'') || content.includes('role+\'s\'') || content.includes('role + "s"') || content.includes('`${userInfo.role}s`') || content.includes('`${userData.role}s`')) {
        console.log(`Found in: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('companys') || line.includes('role') || line.includes('Ref')) {
            console.log(`  L${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  });
};

searchFiles(join(process.cwd(), 'src'));
