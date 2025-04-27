function createResponse(success, message, data = null) {
    return {
        type:"smartHome",
        success,
        message,
        data
    };
}
export { createResponse };