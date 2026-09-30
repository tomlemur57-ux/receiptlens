'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const candidate = fs.existsSync(path.join(__dirname,'../docs/index.html')) ? path.join(__dirname,'../docs/index.html') : path.join(__dirname,'index-fixed.html');
const html = fs.readFileSync(candidate,'utf8');
const script = html.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];
function context(fetcher=async()=>{throw Error('unexpected network request')}) {
  const elements=new Map();
  const $=id=>{if(!elements.has(id))elements.set(id,{value:'',hidden:true,dataset:{},textContent:'',innerHTML:'',addEventListener(){},disabled:false});return elements.get(id)};
  const ctx=vm.createContext({document:{getElementById:$,createElement(){return{click(){}}}},location:{href:'https://example.invalid/receiptlens/'},history:{replaceState(){}},URL,Blob,AbortController,setTimeout,clearTimeout,fetch:fetcher,navigator:{clipboard:{writeText:async()=>{}}}});
  vm.runInContext(script,ctx);
  return {ctx,elements,read:expr=>vm.runInContext(expr,ctx)};
}
const SIG='4irnZHz3Pvdazy14opVxjSLmHnSgUvu9iJesV39roTAZkSFw9Dg8fdQgBSxRBctAsmLuZerDfYa92pi1F8HAVoSr';
const TOKEN='TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const MEMO='MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
function fixture(){return {slot:123,blockTime:1700000000,transaction:{signatures:[SIG],message:{accountKeys:[{pubkey:'payer',signer:true,writable:true},{pubkey:'recipient',signer:false,writable:true}],instructions:[{programId:TOKEN,program:'spl-token',parsed:{type:'transfer',info:{source:'source',destination:'destination',amount:'90071992547409931234'}}},{programId:MEMO,program:'spl-memo',parsed:'<img src=x onerror=alert(1)>'}]}},meta:{err:null,fee:15500,computeUnitsConsumed:24547,preBalances:[1000000,0],postBalances:[984500,0],innerInstructions:[],logMessages:[]}}}
function runReceipt(change=()=>{},statusChange=()=>{}){const c=context();const tx=fixture();change(tx);const status={value:[{slot:123,err:null,confirmationStatus:'finalized'}]};statusChange(status);c.ctx.tx=tx;c.ctx.st=status;c.ctx.sig=SIG;return {c,receipt:()=>c.read('receipt(sig,{result:tx},{result:st})')}}
test('complete finalized synthetic receipt and exact transfer amount',()=>{const {receipt}=runReceipt();const r=receipt();assert.equal(r.status,'Finalized');assert.equal(r.feeLamports,15500);assert.equal(r.tokenTransfers[0].amount,'90071992547409931234');assert.equal(r.tokenTransfers[0].amountUnit,'base units');assert.equal(r.nativeBalanceChanges[0].deltaLamports,-15500)});
test('failed execution omits rolled-back token transfers but retains charged fee',()=>{const {receipt}=runReceipt(tx=>tx.meta.err={InstructionError:[0,'Custom']});const r=receipt();assert.equal(r.status,'Failed');assert.equal(r.tokenTransfers.length,0);assert.equal(r.feeLamports,15500)});
test('failure returned by status also suppresses transfers',()=>{const {receipt}=runReceipt(()=>{},st=>st.value[0].err={InstructionError:[0,'Custom']});assert.equal(receipt().tokenTransfers.length,0)});
test('null block time does not become 1970',()=>{const {receipt}=runReceipt(tx=>tx.blockTime=null);assert.equal(receipt().blockTimeIso,null)});
test('invalid and out-of-range times remain unknown',()=>{for(const value of [true,'1',-1,Number.MAX_SAFE_INTEGER]){const {receipt}=runReceipt(tx=>tx.blockTime=value);assert.equal(receipt().blockTimeIso,null)}});
test('missing/null and unsafe fees remain unknown',()=>{for(const value of [null,undefined,true,'15500',Number.MAX_SAFE_INTEGER+1]){const {receipt}=runReceipt(tx=>tx.meta.fee=value);assert.equal(receipt().feeSol,null)}});
test('unsafe integer native balances are omitted rather than rounded',()=>{const {receipt}=runReceipt(tx=>tx.meta.preBalances[0]=Number.MAX_SAFE_INTEGER+1);assert.equal(receipt().nativeBalanceChanges.length,0)});
test('null, boolean and string balances are not silently coerced to numbers',()=>{for(const val of [null,false,'1']){const {receipt}=runReceipt(tx=>tx.meta.preBalances[0]=val);assert.equal(receipt().nativeBalanceChanges.length,0)}});
test('SOL string rendering remains exact at safe-integer boundary',()=>{const c=context();assert.equal(c.read('fmtSol(9007199254740991)'),'+9007199.254740991 SOL');assert.equal(c.read('fmtSol(-1)'),'-0.000000001 SOL')});
test('canonical SPL program ID required for token transfer classification',()=>{const {receipt}=runReceipt(tx=>tx.transaction.message.instructions[0].programId='NotATokenProgram');assert.equal(receipt().tokenTransfers.length,0)});
test('checked transfer explicitly labels displayed token units',()=>{const {receipt}=runReceipt(tx=>{const p=tx.transaction.message.instructions[0].parsed;p.type='transferChecked';p.info.tokenAmount={uiAmountString:'12.345678',decimals:6}});assert.equal(receipt().tokenTransfers[0].amountUnit,'tokens')});
test('only canonical memo programs populate memos',()=>{const {receipt}=runReceipt(tx=>tx.transaction.message.instructions[1].programId='NotAMemoProgram');assert.equal(receipt().memos.length,0)});
test('inner program invocations are included once',()=>{const {receipt}=runReceipt(tx=>tx.meta.innerInstructions=[{instructions:[{programId:'inner-program'},{programId:TOKEN}]}]);assert.equal(receipt().programs.length,3);assert.ok(receipt().programs.includes('inner-program'))});
test('string-key signers use header rather than guessing only fee payer signs',()=>{const {receipt}=runReceipt(tx=>{tx.transaction.message.accountKeys=['first','second'];tx.transaction.message.header={numRequiredSignatures:2}});assert.equal(receipt().signers.length,2)});
test('absent signer metadata is unknown rather than invented',()=>{const {receipt}=runReceipt(tx=>tx.transaction.message.accountKeys=['first','second']);assert.equal(receipt().signers.length,0)});
test('malformed account entries cannot shift balance indexing',()=>{const {receipt}=runReceipt(tx=>tx.transaction.message.accountKeys[0]=null);assert.throws(receipt,/Malformed transaction account/)});
test('signature substitution is rejected',()=>{const {receipt}=runReceipt(tx=>tx.transaction.signatures[0]='another-signature');assert.throws(receipt,/does not match/)});
test('inconsistent status slot is rejected',()=>{const {receipt}=runReceipt(()=>{},st=>st.value[0].slot=124);assert.throws(receipt,/different slots/)});
test('missing execution metadata cannot be called successful',()=>{const {receipt}=runReceipt(tx=>delete tx.meta);assert.throws(receipt,/metadata is unavailable/)});
test('null transaction raises a clear not-found error',()=>{const c=context();assert.throws(()=>c.read('receipt(SAMPLE,{result:null},{result:null})'),/not found/)});
test('malformed status response is rejected',()=>{const {receipt}=runReceipt(()=>{},st=>st.value=[]);assert.throws(receipt,/Malformed signature-status/)});
test('RPC response IDs must match and results must be present',async()=>{for(const transform of [j=>({...j,id:j.id+1}),j=>({jsonrpc:'2.0',id:j.id})]){const c=context(async(u,o)=>{const q=JSON.parse(o.body);return{ok:true,json:async()=>transform({jsonrpc:'2.0',id:q.id,result:null})}});await assert.rejects(c.read("call('getTransaction',[],undefined)"),/mismatched|no result/)}});
test('RPC 403/429 responses surface without a second transport or credential path',async()=>{for(const status of [403,429]){let calls=0;const c=context(async()=>{calls++;return{ok:false,status}});await assert.rejects(c.read("call('getTransaction',[],undefined)"),new RegExp(String(status)));assert.equal(calls,1)}});
test('client sends fixed Devnet URL, no browser credentials and read-only methods',async()=>{const seen=[];const c=context(async(u,o)=>{seen.push([u,o]);const q=JSON.parse(o.body);return{ok:true,json:async()=>({jsonrpc:'2.0',id:q.id,result:null})}});await c.read('inspectRpc(SAMPLE)');assert.equal(seen.length,2);for(const [u,o] of seen){assert.equal(u,'https://api.devnet.solana.com');assert.equal(o.credentials,'omit');assert.ok(['getTransaction','getSignatureStatuses'].includes(JSON.parse(o.body).method))}});
test('malicious memo is escaped before DOM insertion',()=>{const {c,receipt}=runReceipt();c.ctx.output=receipt();c.read('render(output)');assert.match(c.elements.get('memos').innerHTML,/&lt;img/);assert.doesNotMatch(c.elements.get('memos').innerHTML,/<img/)});
test('invalid next lookup clears current exportable receipt',async()=>{const {c,receipt}=runReceipt();c.ctx.output=receipt();c.read('render(output)');c.elements.get('signature').value='invalid';await c.read('inspect()');assert.equal(c.read('current'),null);assert.equal(c.elements.get('result').hidden,true)});
test('asset includes explicit test-network and transfer-vs-credit boundary',()=>{assert.match(html,/Devnet is a test network, not proof of real payment/);assert.match(html,/Transfer instructions are not net recipient credits/)});
