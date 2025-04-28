function createResponse(success=true, message, data = null) {
    return {
        type:"smartHome",
        success,
        message,
        data
    };
}
export { createResponse };