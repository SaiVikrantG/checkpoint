import { createContext, useContext, useRef, useCallback } from 'react';

const NavigationGuardContext = createContext(null);

export function NavigationGuardProvider({ children }) {
  const guardRef = useRef(null);

  const setGuard = useCallback((fn) => {
    guardRef.current = fn;
  }, []);

  const clearGuard = useCallback(() => {
    guardRef.current = null;
  }, []);

  const checkGuard = useCallback((to) => {
    if (guardRef.current) return guardRef.current(to);
    return true;
  }, []);

  return (
    <NavigationGuardContext.Provider value={{ setGuard, clearGuard, checkGuard }}>
      {children}
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard() {
  return useContext(NavigationGuardContext);
}
