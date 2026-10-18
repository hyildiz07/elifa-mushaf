import {firebaseServices} from '../../server/firebase.mjs';
import {createAccountHandler} from '../../server/account-handler.mjs';
import {releaseAccountHatimOwnership} from '../../server/hatim-account.mjs';
export default createAccountHandler({services:firebaseServices,detachMemberships:releaseAccountHatimOwnership});
export const config={path:'/api/account'};
