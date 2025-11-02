/** @type {import('tailwindcss').Config} */
export default {
    content: ["./resources/**/*.blade.php", "./resources/js/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: "#f2fbff",
                    100: "#e6f7ff",
                    200: "#bfeaff",
                    300: "#99dcff",
                    400: "#4ec0ff",
                    500: "#1ea2ff",
                    600: "#0b84e5",
                    700: "#0767b3",
                    800: "#064f8a",
                    900: "#063d6b"
                }
            },
            boxShadow: {
                card: "0 8px 24px rgba(2, 6, 23, 0.08)"
            },
            borderRadius: {
                xl: "14px"
            }
        }
    },
    plugins: []
}