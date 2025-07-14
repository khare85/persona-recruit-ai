/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Cloud Functions entry point
import { onUserCreate, setUserRole } from './auth/onUserCreate';
import { setSuperAdminRole, initializeSuperAdmin } from './auth/setAdminRole';

// Export Cloud Functions
export { onUserCreate, setUserRole, setSuperAdminRole, initializeSuperAdmin };
