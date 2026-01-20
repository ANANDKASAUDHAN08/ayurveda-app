// Polyfills for Node.js APIs in browser
import { Buffer } from 'buffer';
import process from 'process';

// Make them globally available
window.global = window;
window.Buffer = Buffer;
window.process = process;
window.process.env = window.process.env || { DEBUG: undefined };
