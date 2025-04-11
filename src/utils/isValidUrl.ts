const isValidUrl = (url: string) => {
    if (!url) return true; // Allow empty redirectUrl
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
};

export default isValidUrl