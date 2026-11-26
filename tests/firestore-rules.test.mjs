import { initializeTestEnvironment, assertSucceeds as ok, assertFails as no } from '@firebase/rules-unit-testing';
import fs from 'fs';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
const FV = firebase.firestore.FieldValue;
const env = await initializeTestEnvironment({ projectId: 'demo-ta35', firestore: { rules: fs.readFileSync(new URL('../firestore.rules', import.meta.url),'utf8'), host:'127.0.0.1', port:8181 } });
await env.withSecurityRulesDisabled(async c => {
  const d = c.firestore();
  await d.doc('users/bob').set({ cash: 30000, username:'bob' });
  await d.doc('stock_posts/p1').set({ userId:'bob', content:'hi', likes:[], likeCount:0, commentCount:0 });
  await d.doc('stock_posts/p1/comments/c1').set({ userId:'alice', content:'x', likes:[], likeCount:0 });
  await d.doc('stock_posts/p1/comments/c2').set({ userId:'carol', content:'y' });
  await d.doc('leaderboard/bob').set({ userId:'bob', returnPercent: 5 });
  await d.doc('price_history/old').set({ stockId:'TEVA', price:1, timestamp: Date.now() - 400*864e5 });
  await d.doc('price_history/new').set({ stockId:'TEVA', price:1, timestamp: Date.now() });
});
const A = env.authenticatedContext('alice').firestore();
const B = env.authenticatedContext('bob').firestore();
const anon = env.unauthenticatedContext().firestore();
let pass=0, fail=0;
async function t(name, p){ try { await p; pass++; } catch(e){ fail++; console.log('FAIL', name, e.message.split('\n')[0]); } }
// own data
await t('alice writes own user doc', ok(A.doc('users/alice').set({cash:1,username:'alice'},{merge:true})));
await t('alice update own', ok(A.doc('users/alice').update({cash:2})));
await t('alice reads bob profile', ok(A.doc('users/bob').get()));
await t('alice cannot write bob', no(A.doc('users/bob').update({cash:1e9})));
await t('anon cannot read', no(anon.doc('users/bob').get()));
await t('users query', ok(A.collection('users').where('username','>=','b').where('username','<=','b').get()));
await t('users limit', ok(A.collection('users').limit(50).get()));
for (const sub of ['activity','bookmarks','saved_calculations','real_holdings']) {
  await t('own '+sub, ok(A.collection('users/alice/'+sub).add({x:1})));
  await t('other '+sub+' read', no(A.collection('users/bob/'+sub).get()));
}
await t('publicProfiles own', ok(A.doc('publicProfiles/alice').set({username:'alice'},{merge:true})));
await t('publicProfiles other', no(A.doc('publicProfiles/bob').set({username:'x'})));
await t('publicProfiles query', ok(A.collection('publicProfiles').where('username','>=','a').get()));
// follow
await t('follow: target followers', ok(A.doc('users/bob/followers/alice').set({userId:'alice'})));
await t('follow: my following', ok(A.doc('users/alice/following/bob').set({userId:'bob'})));
await t('fake follower', no(A.doc('users/bob/followers/carol').set({userId:'carol'})));
await t('unfollow', ok(A.doc('users/bob/followers/alice').delete()));
await t('read bob followers', ok(A.collection('users/bob/followers').get()));
// notifications
await t('notify bob', ok(A.collection('users/bob/notifications').add({type:'like', read:false})));
await t('read bob notifs', no(A.collection('users/bob/notifications').get()));
await t('own notifs read', ok(B.collection('users/bob/notifications').get()));
// crown
await t('crown_history add', ok(A.collection('users/bob/crown_history').add({daysHeld:1})));
await t('crown_history read', ok(A.collection('users/bob/crown_history').get()));
// leaderboard
await t('lb own set', ok(A.doc('leaderboard/alice').set({userId:'alice', returnPercent:3, updatedAt: FV.serverTimestamp()},{merge:true})));
await t('lb query', ok(A.collection('leaderboard').orderBy('returnPercent','desc').limit(10).get()));
await t('lb crown other', ok(A.doc('leaderboard/bob').update({crownDays:1, currentMedal:{emoji:'x'}})));
await t('lb other returnPercent', no(A.doc('leaderboard/bob').update({returnPercent: 999})));
await t('lb_state set', ok(A.doc('leaderboard_state/current').set({topUserId:'bob', topDisplayName:'b', crownDays:1, crownStartDate:'d', lastCheckDate:'d'})));
await t('lb_state merge', ok(A.doc('leaderboard_state/current').set({topUserId:'bob', crownDays:2, lastCheckDate:'e'},{merge:true})));
await t('lb_state junk', no(A.doc('leaderboard_state/current').set({evil:1},{merge:true})));
// posts
await t('post create', ok(A.collection('stock_posts').add({userId:'alice', content:'a', likes:[], likeCount:0})));
await t('post spoof', no(A.collection('stock_posts').add({userId:'bob', content:'a'})));
await t('like', ok(A.doc('stock_posts/p1').update({likes: FV.arrayUnion('alice'), likeCount: FV.increment(1)})));
await t('react', ok(A.doc('stock_posts/p1').update({['reactions.🔥']: FV.arrayUnion('alice')})));
await t('report', ok(A.doc('stock_posts/p1').update({reports: FV.arrayUnion('alice')})));
await t('hide', ok(A.doc('stock_posts/p1').update({hidden: true})));
await t('edit others content', no(A.doc('stock_posts/p1').update({content:'pwn'})));
await t('comment add', ok(A.collection('stock_posts/p1/comments').add({userId:'alice', content:'c'})));
await t('commentCount', ok(A.doc('stock_posts/p1').update({commentCount: FV.increment(1)})));
await t('comment like', ok(B.doc('stock_posts/p1/comments/c1').update({likes: FV.arrayUnion('bob'), likeCount: FV.increment(1)})));
await t('comment edit other', no(B.doc('stock_posts/p1/comments/c1').update({content:'hacked'})));
await t('delete others comment (not post owner)', no(A.doc('stock_posts/p1/comments/c2').delete()));
await t('posts query', ok(A.collection('stock_posts').limit(50).get()));
await t('delete others post', no(A.doc('stock_posts/p1').delete()));
await t('post owner deletes comments', ok(B.doc('stock_posts/p1/comments/c2').delete()));
await t('post owner deletes post', ok(B.doc('stock_posts/p1').delete()));
// price history
await t('ph add', ok(A.collection('price_history').add({stockId:'TEVA', price:1, timestamp: Date.now()})));
await t('ph del old', ok(A.doc('price_history/old').delete()));
await t('ph del new', no(A.doc('price_history/new').delete()));
// exit terminal
await t('exit own', ok(A.doc('exitTerminal/alice').set({x:1})));
await t('exit other', no(A.doc('exitTerminal/bob').get()));
await t('unknown coll', no(A.collection('random').add({x:1})));
console.log(`passed ${pass}, failed ${fail}`);
await env.cleanup(); process.exit(fail?1:0);
