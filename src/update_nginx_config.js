import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    throw new Error('Local IP not found');
}

const localIP = getLocalIP();
const nginxConfigPath = path.join("C:\\nginx\\nginx-1.27.1", 'conf', 'nginx.conf');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptsFilePath = path.join(__dirname, 'scripts.js');
console.log('Nginx config path:', nginxConfigPath);
console.log('Local IP:', localIP);

async function updateNginxConfig() {
    try {
        const data = await fs.readFile(nginxConfigPath, 'utf8');
        const updatedConfig = data.replace(/server_name\s+\S+;/, `server_name ${localIP};`);
        await fs.writeFile(nginxConfigPath, updatedConfig, 'utf8');
        console.log('Nginx config updated successfully with local IP:', localIP);
    } catch (err) {
        console.error('Error updating Nginx config file:', err);
    }
}

async function updateScriptsFile() {
    try {
        const data = await fs.readFile(scriptsFilePath, 'utf8');
        const updatedScripts = data.replace(/^const\s+socket\s*=\s*io/, `const socket = io(\`${localIP}:8080/\`, {\n    transports: ['websocket']\n});`);
        await fs.writeFile(scriptsFilePath, updatedScripts, 'utf8');
        console.log('scripts.js updated successfully with local IP:', localIP);
    } catch (err) {
        console.error('Error updating scripts.js file:', err);
    }
}

async function main() {
    await updateNginxConfig();
    await updateScriptsFile();
}

main();
