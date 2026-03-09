import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";
import { hashPin, registerBiometric, authenticateWithBiometric } from "@/lib/auth/webauthn";

const USER_COLORS = ["#111111", "#cc0000", "#00693C", "#741EE8", "#FCD535", "#004B87", "#E01F4E"];

interface AuthState {
    users: User[];
    currentUserId: string | null;
    isAuthenticated: boolean;

    initDefaultUser: () => void;
    register: (name: string, username: string, pin: string, colorIndex?: number) => Promise<User>;
    loginWithPin: (userId: string, pin: string) => Promise<boolean>;
    loginWithBiometric: (userId: string) => Promise<boolean>;
    setupBiometric: (userId: string) => Promise<boolean>;
    logout: () => void;
    getCurrentUser: () => User | null;
    updateUser: (userId: string, updates: Partial<Pick<User, "name" | "username" | "color">>) => void;
    deleteUser: (userId: string) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            users: [],
            currentUserId: null,
            isAuthenticated: false,

            initDefaultUser: () => {
                if (get().users.length > 0) return;
                set({
                    users: [{
                        id: "rafa-default",
                        name: "Rafa",
                        username: "rafa",
                        color: "#cc0000",
                        pinHash: undefined,
                        biometricEnabled: false,
                        created_at: new Date().toISOString(),
                    }],
                });
            },

            register: async (name, username, pin, colorIndex = 0) => {
                const pinHash = await hashPin(pin);
                const newUser: User = {
                    id: crypto.randomUUID(),
                    name,
                    username: username.toLowerCase().trim(),
                    color: USER_COLORS[colorIndex % USER_COLORS.length],
                    pinHash,
                    biometricEnabled: false,
                    created_at: new Date().toISOString(),
                };
                set(state => ({ users: [...state.users, newUser] }));
                return newUser;
            },

            loginWithPin: async (userId, pin) => {
                const { users } = get();
                const user = users.find(u => u.id === userId);
                if (!user) return false;
                // No PIN set → allow direct access (first-time use)
                if (!user.pinHash) {
                    set({ currentUserId: userId, isAuthenticated: true });
                    return true;
                }
                const hash = await hashPin(pin);
                if (hash !== user.pinHash) return false;
                set({ currentUserId: userId, isAuthenticated: true });
                return true;
            },

            loginWithBiometric: async (userId) => {
                const { users } = get();
                const user = users.find(u => u.id === userId);
                if (!user?.biometricCredentialId) return false;
                const ok = await authenticateWithBiometric(user.biometricCredentialId);
                if (ok) set({ currentUserId: userId, isAuthenticated: true });
                return ok;
            },

            setupBiometric: async (userId) => {
                const { users } = get();
                const user = users.find(u => u.id === userId);
                if (!user) return false;
                const credId = await registerBiometric(userId, user.name);
                if (!credId) return false;
                set(state => ({
                    users: state.users.map(u =>
                        u.id === userId
                            ? { ...u, biometricCredentialId: credId, biometricEnabled: true }
                            : u
                    ),
                }));
                return true;
            },

            logout: () => set({ currentUserId: null, isAuthenticated: false }),

            getCurrentUser: () => {
                const { users, currentUserId } = get();
                return users.find(u => u.id === currentUserId) ?? null;
            },

            updateUser: (userId, updates) => {
                set(state => ({
                    users: state.users.map(u => u.id === userId ? { ...u, ...updates } : u),
                }));
            },

            deleteUser: (userId) => {
                set(state => ({
                    users: state.users.filter(u => u.id !== userId),
                    currentUserId: state.currentUserId === userId ? null : state.currentUserId,
                    isAuthenticated: state.currentUserId === userId ? false : state.isAuthenticated,
                }));
            },
        }),
        { name: "churupitos-auth" }
    )
);
