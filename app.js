import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@6.15.0/+esm';
const BSC_CHAIN_ID = '0x38';
const BSC_CHAIN_DEC = 56;
const ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 value) returns (bool)'
];
const $ = (id) => document.getElementById(id);
let provider = null, signer = null, account = '', injectedProvider = null, token = null, tokenDecimals = 18, tokenSymbol = 'Educational USDT';
let realHistory = JSON.parse(localStorage.getItem('bep20-real-history') || '[]');
let simHistory = JSON.parse(localStorage.getItem('bep20-sim-history') || '[]');
let demoBalance = Number(localStorage.getItem('bep20-demo-balance') || '10000');
$('demoBalance').textContent = demoBalance.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});

function status(id, msg, kind='') { const el=$(id); el.textContent=msg; el.className='status '+kind; }
function short(s) { return s ? `${s.slice(0,8)}…${s.slice(-6)}` : '—'; }
function saveHistory(){localStorage.setItem('bep20-real-history',JSON.stringify(realHistory));localStorage.setItem('bep20-sim-history',JSON.stringify(simHistory));}
function renderHistory(){
  const box=$('history'); const rows=[...realHistory.map(x=>({...x,sim:false})),...simHistory.map(x=>({...x,sim:true}))].sort((a,b)=>b.time-a.time);
  if(!rows.length){box.className='history-empty';box.textContent='No transactions yet.';return;}
  box.className=''; box.innerHTML='';
  for(const r of rows){const row=document.createElement('div');row.className='history-row';const type=document.createElement('div');const badge=document.createElement('span');badge.className='badge'+(r.sim?' sim':'');badge.textContent=r.sim?'SIMULATED':'ON-CHAIN';type.append(badge);const detail=document.createElement('div');const title=document.createElement('strong');title.textContent=`${r.amount} ${r.sim?'sUSDT':(r.symbol||tokenSymbol)}`;const sub=document.createElement('small');sub.textContent=`To: ${r.to} · ${new Date(r.time).toLocaleString()}`;detail.append(title,sub);const link=document.createElement(r.sim?'span':'a');if(r.sim){link.textContent='Local only';link.style.color='#6e45b8';}else{link.textContent='View on BscScan ↗';link.href=`${r.explorer||'https://bscscan.com/tx/'}${r.hash}`;link.target='_blank';link.rel='noopener';link.style.color='#315bd6';}row.append(type,detail,link);box.append(row);}
}
function getInjected(){
  if(window.ethereum?.isTrust) return window.ethereum;
  if(window.ethereum?.providers){const tw=window.ethereum.providers.find(p=>p.isTrust);if(tw)return tw;}
  return window.trustwallet || window.ethereum || null;
}
async function ensureBsc(){
  const chainId=await provider.send('eth_chainId',[]);
  if(chainId.toLowerCase()!==BSC_CHAIN_ID){
    try{await provider.send('wallet_switchEthereumChain',[{chainId:BSC_CHAIN_ID}]);}
    catch(e){if(e.code===4902){await provider.send('wallet_addEthereumChain',[{chainId:BSC_CHAIN_ID,chainName:'BNB Smart Chain',nativeCurrency:{name:'BNB',symbol:'BNB',decimals:18},rpcUrls:['https://bsc-dataseed.binance.org/'],blockExplorerUrls:['https://bscscan.com/']}]);}else throw e;}
  }
}
async function refreshBalances(){
  if(!provider||!account)return;
  try{
    const net=await provider.getNetwork(); $('network').textContent=Number(net.chainId)===BSC_CHAIN_DEC?'BNB Smart Chain':'Wrong network';
    const bnb=await provider.getBalance(account);$('bnbBalance').textContent=`${Number(ethers.formatEther(bnb)).toFixed(5)} BNB`;
    if(Number(net.chainId)!==BSC_CHAIN_DEC){$('tokenBalance').textContent='Switch to BNB Smart Chain';$('sendBtn').disabled=true;return;}
    const contractAddress=$('mainContract').value.trim();
    if(!ethers.isAddress(contractAddress)){$('tokenBalance').textContent='Enter a deployed Educational USDT contract';$('sendBtn').disabled=true;return;}
    const readToken=new ethers.Contract(contractAddress,ABI,provider);token=readToken;
    try{tokenDecimals=Number(await token.decimals());tokenSymbol=await token.symbol();}catch{throw new Error('Could not read token metadata. Check network/RPC.');}
    const bal=await token.balanceOf(account);$('tokenBalance').textContent=`${ethers.formatUnits(bal,tokenDecimals)} ${tokenSymbol}`;
    $('sendBtn').disabled=!(String(tokenSymbol).toLowerCase()==='demousdt');
  }catch(e){status('walletStatus',e.shortMessage||e.message||'Unable to read balances.','error');}
}
$('connectBtn').addEventListener('click',async()=>{
  try{
    const injected=getInjected();if(!injected)throw new Error('No compatible wallet provider found. Open this page in a browser with Trust Wallet or another EVM wallet.');
    await injected.request({method:'eth_requestAccounts'});provider=new ethers.BrowserProvider(injected);await ensureBsc();signer=await provider.getSigner();account=await signer.getAddress();
    $('address').textContent=account;$('network').textContent='Connected';$('connectBtn').textContent='Wallet connected';status('walletStatus','Connected. Check the address and token contract before sending.','success');
    injectedProvider=injected;injected.on?.('accountsChanged',async()=>{try{const a=await injected.request({method:'eth_accounts'});account=a[0]||'';$('address').textContent=account||'Not connected';provider=new ethers.BrowserProvider(injected);signer=account?await provider.getSigner():null;await refreshBalances();}catch{}});injected.on?.('chainChanged',async()=>{provider=new ethers.BrowserProvider(injected);try{signer=account?await provider.getSigner():null;await refreshBalances();}catch{}});await refreshBalances();
  }catch(e){status('walletStatus',e.shortMessage||e.message||'Wallet connection failed.','error');}
});
$('loadTokenBtn').addEventListener('click',async()=>{
  try{if(!provider||!account)throw new Error('Connect your wallet first.');await refreshBalances();if($('sendBtn').disabled)throw new Error('Could not load a Educational USDT contract. Check that the address is deployed on BNB Smart Chain Mainnet and its symbol is Educational USDT.');status('walletStatus',`Loaded ${tokenSymbol} contract and balance. Verify the contract address carefully.`,'success');}
  catch(e){status('walletStatus',e.shortMessage||e.message||'Unable to load Educational USDT contract.','error');}
});
$('mainContract').addEventListener('change',()=>{if(provider&&account)refreshBalances();});
$('sendBtn').addEventListener('click',async()=>{
  try{
    if(!provider||!signer||!account)throw new Error('Connect your wallet first.');
    await ensureBsc();const tokenAddress=$('mainContract').value.trim();const to=$('recipient').value.trim();const amountText=$('amount').value.trim();
    if(!ethers.isAddress(tokenAddress))throw new Error('Enter your deployed Educational USDT contract address.');
    if(!ethers.isAddress(to))throw new Error('Enter a valid EVM recipient address.');
    if(to.toLowerCase()===account.toLowerCase())throw new Error('Recipient is the connected sender address.');
    if(!amountText||!/^\d+(\.\d+)?$/.test(amountText)||Number(amountText)<=0)throw new Error('Enter a valid positive amount.');
    token=new ethers.Contract(tokenAddress,ABI,signer);tokenDecimals=Number(await token.decimals());tokenSymbol=await token.symbol();
    if(tokenSymbol.toLowerCase()!=='usdt')throw new Error(`Refusing to send: this contract symbol is ${tokenSymbol}, not Educational USDT.`);
    const amount=ethers.parseUnits(amountText,tokenDecimals);const bal=await token.balanceOf(account);if(bal<amount)throw new Error(`Insufficient ${tokenSymbol} balance.`);
    const native=await provider.getBalance(account);if(native===0n)throw new Error('No BNB available for gas fees.');
    const confirmed=window.confirm(`MAINNET DEMO TOKEN TRANSFER — NOT GENUINE USDT\n\nToken: ${tokenSymbol} (custom token)\nContract: ${tokenAddress}\nTo: ${to}\nAmount: ${amountText}\n\nThis sends Educational USDT on BNB Smart Chain. It does not send or create genuine USDT. Mainnet gas costs real BNB and transfers may be irreversible. Continue only if you verified the contract and recipient.`);
    if(!confirmed)return;
    $('sendBtn').disabled=true;status('sendStatus','Waiting for wallet approval…');
    const tx=await token.transfer(to,amount);status('sendStatus',`Transaction submitted: ${tx.hash}. Waiting for confirmation…`);
    const receipt=await tx.wait();realHistory.unshift({time:Date.now(),to,amount:amountText,symbol:tokenSymbol,hash:tx.hash,status:receipt.status});saveHistory();renderHistory();
    status('sendStatus',`Educational USDT transfer confirmed in block ${receipt.blockNumber}. View on BscScan: https://bscscan.com/tx/${tx.hash}`,'success');$('amount').value='';await refreshBalances();
  }catch(e){status('sendStatus',e.shortMessage||e.reason||e.message||'Transaction failed.','error');}finally{$('sendBtn').disabled=!(provider&&account);}
});
$('simulateBtn').addEventListener('click',()=>{
  const to=$('simRecipient').value.trim();const amountText=$('simAmount').value.trim();
  if(!to){status('simStatus','Enter a test recipient label or address.','error');return;}
  if(!amountText||!/^\d+(\.\d{1,2})?$/.test(amountText)||Number(amountText)<=0){status('simStatus','Enter a positive amount with up to 2 decimal places.','error');return;}
  const amount=Number(amountText);if(amount>demoBalance){status('simStatus','Insufficient demo sUSDT balance.','error');return;}
  demoBalance=Math.round((demoBalance-amount)*100)/100;localStorage.setItem('bep20-demo-balance',String(demoBalance));$('demoBalance').textContent=demoBalance.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  simHistory.unshift({time:Date.now(),to,amount:amount.toFixed(2),id:`SIM-${Date.now()}`});saveHistory();renderHistory();$('simAmount').value='';status('simStatus','Simulated transfer recorded locally. No blockchain transaction was created.','success');
});
$('clearSimBtn').addEventListener('click',()=>{if(confirm('Clear all simulated history and reset demo balance to 10,000 sUSDT?')){simHistory=[];demoBalance=10000;localStorage.setItem('bep20-demo-balance','10000');$('demoBalance').textContent='10,000.00';saveHistory();renderHistory();status('simStatus','Demo balance and simulated history reset.','success');}});
renderHistory();


async function ensureBscTestnet(p){
  const chainId=await p.send('eth_chainId',[]);
  if(chainId.toLowerCase()!=='0x61'){
    try{await p.send('wallet_switchEthereumChain',[{chainId:'0x61'}]);}
    catch(e){if(e.code===4902){await p.send('wallet_addEthereumChain',[{chainId:'0x61',chainName:'BNB Smart Chain Testnet',nativeCurrency:{name:'tBNB',symbol:'tBNB',decimals:18},rpcUrls:['https://data-seed-prebsc-1-s1.bnbchain.org:8545/'],blockExplorerUrls:['https://testnet.bscscan.com/']}]);}else throw e;}
  }
}
$('testSendBtn').addEventListener('click',async()=>{
  try{
    const injected=injectedProvider||getInjected();
    if(!injected)throw new Error('Open this app in a browser with a compatible wallet and connect it first.');
    if(!account){await injected.request({method:'eth_requestAccounts'});}
    await ensureBscTestnet(new ethers.BrowserProvider(injected));
    const p=new ethers.BrowserProvider(injected);const s=await p.getSigner();const from=await s.getAddress();
    const contractAddress=$('testContract').value.trim();const to=$('testRecipient').value.trim();const amountText=$('testAmount').value.trim();
    if(!ethers.isAddress(contractAddress))throw new Error('Enter the deployed TESTUSD contract address.');
    if(!ethers.isAddress(to))throw new Error('Enter a valid recipient address.');
    if(to.toLowerCase()===from.toLowerCase())throw new Error('Recipient is the connected sender address.');
    if(!amountText||!/^[0-9]+(\.[0-9]+)?$/.test(amountText)||Number(amountText)<=0)throw new Error('Enter a valid positive amount.');
    const testAbi=['function name() view returns (string)','function symbol() view returns (string)','function decimals() view returns (uint8)','function balanceOf(address) view returns (uint256)','function transfer(address,uint256) returns (bool)'];
    const t=new ethers.Contract(contractAddress,testAbi,s);const decimals=Number(await t.decimals());const symbol=await t.symbol();
    if(symbol.toUpperCase()==='USDT')throw new Error('This testnet feature is intended for the clearly labelled TESTUSD contract, not a token pretending to be genuine USDT.');
    const amount=ethers.parseUnits(amountText,decimals);const bal=await t.balanceOf(from);if(bal<amount)throw new Error(`Insufficient ${symbol} balance.`);
    const native=await p.getBalance(from);if(native===0n)throw new Error('No testnet BNB available for gas.');
    if(!confirm(`TESTNET TOKEN TRANSFER — NO REAL VALUE\n\nToken: ${symbol}\nContract: ${contractAddress}\nTo: ${to}\nAmount: ${amountText}\n\nThis is a testnet transaction, not genuine USDT. Continue?`))return;
    $('testSendBtn').disabled=true;status('testStatus','Waiting for wallet approval…');
    const tx=await t.transfer(to,amount);status('testStatus',`Submitted: ${tx.hash}. Waiting for confirmation…`);
    const receipt=await tx.wait();realHistory.unshift({time:Date.now(),to,amount:amountText,symbol:`${symbol} (TESTNET)`,hash:tx.hash,status:receipt.status,explorer:'https://testnet.bscscan.com/tx/'});saveHistory();renderHistory();
    status('testStatus',`Testnet transaction confirmed in block ${receipt.blockNumber}. Tx: ${tx.hash}`,'success');$('testAmount').value='';
  }catch(e){status('testStatus',e.shortMessage||e.reason||e.message||'Test-token transfer failed.','error');}finally{$('testSendBtn').disabled=false;}
});
