
function errorHandler(err, req, res, next) {

    console.error(`[ERROR] ${err.message}`);

    let statusCode = err.status || 500;
    let message = err.message || 'משהו השתבש בשרת';
    
    switch (statusCode) {
        case 400:
            message = 'בקשה לא תקינה (Bad Request)';
            break;
        case 401:
            message = 'לא מאושר (Unauthorized)';
            break;
        case 403:
            message = 'גישה אסורה (Forbidden)';
            break;
        case 404:
            message = 'הנתיב לא נמצא (Not Found)';
            break;
        case 500:
        default:
            message = 'שגיאה פנימית בשרת (Internal Server Error)';
            break;
    }

    res.status(statusCode).json({
        success: false,
        message: message,
    });
}

module.exports = errorHandler;
