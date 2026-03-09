/** WebAuthn (Face ID / Touch ID / fingerprint) helpers */

const RP_ID = typeof window !== "undefined" ? window.location.hostname : "localhost";
const RP_NAME = "Churupitos";

function base64UrlEncode(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array<ArrayBuffer> {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    return new Uint8Array(Array.from(raw, c => c.charCodeAt(0)));
}

export function isBiometricSupported(): boolean {
    return typeof window !== "undefined" && !!window.PublicKeyCredential;
}

/** Register a biometric credential for a user. Returns the credential ID (base64url) or null on failure. */
export async function registerBiometric(userId: string, userName: string): Promise<string | null> {
    if (!isBiometricSupported()) return null;
    try {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const credential = await navigator.credentials.create({
            publicKey: {
                challenge,
                rp: { name: RP_NAME, id: RP_ID },
                user: {
                    id: new TextEncoder().encode(userId),
                    name: userName,
                    displayName: userName,
                },
                pubKeyCredParams: [
                    { type: "public-key", alg: -7 },  // ES256
                    { type: "public-key", alg: -257 }, // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    userVerification: "required",
                    residentKey: "preferred",
                },
                timeout: 60000,
            },
        }) as PublicKeyCredential | null;

        if (!credential) return null;
        return base64UrlEncode(credential.rawId);
    } catch {
        return null;
    }
}

/** Authenticate using a previously registered biometric credential. Returns true on success. */
export async function authenticateWithBiometric(credentialIdBase64: string): Promise<boolean> {
    if (!isBiometricSupported()) return false;
    try {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const credential = await navigator.credentials.get({
            publicKey: {
                challenge,
                allowCredentials: [
                    {
                        type: "public-key",
                        id: base64UrlDecode(credentialIdBase64),
                        transports: ["internal"],
                    },
                ],
                userVerification: "required",
                timeout: 60000,
            },
        });
        return !!credential;
    } catch {
        return false;
    }
}

/** Hash a PIN using SHA-256 → base64 string */
export async function hashPin(pin: string): Promise<string> {
    const encoded = new TextEncoder().encode(pin);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return base64UrlEncode(digest);
}
