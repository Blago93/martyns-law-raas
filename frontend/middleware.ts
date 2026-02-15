import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// DISABLED: This middleware was blocking the login page
// Re-enable if you want HTTP Basic Auth on the entire site
export function middleware(req: NextRequest) {
    // Allow all requests through - using form-based auth instead
    return NextResponse.next();

    /* Original Basic Auth Code (disabled)
    const basicAuth = req.headers.get('authorization');

    if (basicAuth) {
        const authValue = basicAuth.split(' ')[1];
        const [user, pwd] = atob(authValue).split(':');

        if (user === process.env.TEST_ADMIN_USER && pwd === process.env.TEST_ADMIN_PASS) {
            return NextResponse.next();
        }
    }

    return new NextResponse('Auth Required', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Secure Area"',
        },
    });
    */
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
