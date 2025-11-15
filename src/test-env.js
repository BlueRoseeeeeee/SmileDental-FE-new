// Test file to check if Vite loads env vars
console.log('=== ENV VARS TEST ===');
console.log('VITE_AUTH_API_URL:', import.meta.env.VITE_AUTH_API_URL);
console.log('VITE_USER_API_URL:', import.meta.env.VITE_USER_API_URL);
console.log('VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);
console.log('MODE:', import.meta.env.MODE);
console.log('DEV:', import.meta.env.DEV);
console.log('PROD:', import.meta.env.PROD);
console.log('===================');
