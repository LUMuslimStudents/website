// accounts.ts is an aggregator that re-exports from all pathway files
// All actual logic is in the files under /pathways/

// Signup routes
export {
    signup,
    type SignupInput,
} from './pathways/signupPathways';

// Auth routes (login, password reset, current user, sign out, admin)
export {
    login,
    requestPasswordReset,
    verifyResetToken,
    verifySignupToken,
    updatePassword,
    getCurrentUser,
    signOut,
    getUsers,
} from './pathways/authPathways';
