import {firebaseServices} from '../../server/firebase.mjs';
import {createAccountHandler} from '../../server/account-handler.mjs';
export default createAccountHandler({services:firebaseServices});
export const config={path:'/api/account'};
