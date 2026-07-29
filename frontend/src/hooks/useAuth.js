import { useSelector, useDispatch } from "react-redux";
import { loginUser, registerUser, fetchProfile } from "../features/auth/authThunk";
import { logout, clearError } from "../features/auth/authSlice";

// Redux-backed replacement for the old AuthContext. Preserves the same surface
// the components already use — { user, tokens, loading, error, login, register,
// logout, refreshUser } — so swapping the import path is the only change needed
// at call sites.
//
// `login` / `register` return promises that resolve with the user (or true) on
// success and throw an Error on failure, matching the previous Context behavior
// so existing try/catch blocks in Login/Register keep working.
export const useAuth = () => {
  const { user, tokens, loading, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const login = async (username, password) => {
    const result = await dispatch(loginUser({ username, password }));
    if (loginUser.fulfilled.match(result)) return result.payload.user;
    throw new Error(result.payload || "Login failed");
  };

  const register = async (formData) => {
    const result = await dispatch(registerUser(formData));
    if (registerUser.fulfilled.match(result)) return true;
    throw new Error(result.payload || "Registration failed");
  };

  const refreshUser = async () => {
    await dispatch(fetchProfile());
  };

  return {
    user,
    tokens,
    loading,
    error,
    login,
    register,
    logout: () => dispatch(logout()),
    refreshUser,
    clearError: () => dispatch(clearError()),
  };
};