import { createClient } from "npm:@supabase/supabase-js@2";

console.log("🚀 provision-account starting");

// --------------------------------------------------
// Supabase environment variables
// --------------------------------------------------

const supabaseUrl = Deno.env.get("SUPABASE_URL");

const secretKeysRaw = Deno.env.get(
    "SUPABASE_SECRET_KEYS"
);

console.log(
    "SUPABASE_URL exists:",
    !!supabaseUrl
);

console.log(
    "SUPABASE_SECRET_KEYS exists:",
    !!secretKeysRaw
);

if (!supabaseUrl) {
    throw new Error(
        "SUPABASE_URL is missing"
    );
}

if (!secretKeysRaw) {
    throw new Error(
        "SUPABASE_SECRET_KEYS is missing"
    );
}

// SUPABASE_SECRET_KEYS is a JSON object
const secretKeys = JSON.parse(
    secretKeysRaw
);

const secretKey = secretKeys["default"];

if (!secretKey) {
    throw new Error(
        "Default Supabase secret key is missing"
    );
}

// --------------------------------------------------
// Admin client
// --------------------------------------------------

const supabaseAdmin = createClient(
    supabaseUrl,
    secretKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

console.log(
    "✅ Supabase admin client created"
);

// --------------------------------------------------
// Edge Function
// --------------------------------------------------

Deno.serve(async (req: Request) => {

    console.log("📥 Request received");
    console.log("Method:", req.method);

    try {

        // --------------------------------------------------
        // Only allow POST
        // --------------------------------------------------

        if (req.method !== "POST") {
            return new Response(
                JSON.stringify({
                    error: "Only POST requests are allowed",
                }),
                {
                    status: 405,
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }

        // --------------------------------------------------
        // Get Authorization header
        // --------------------------------------------------

        const authHeader =
            req.headers.get(
                "Authorization"
            );

        if (!authHeader) {

            console.log(
                "❌ No Authorization header"
            );

            return new Response(
                JSON.stringify({
                    error:
                        "Missing Authorization header",
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }

        // --------------------------------------------------
        // Extract JWT
        // --------------------------------------------------

        const token =
            authHeader.replace(
                "Bearer ",
                ""
            );

        if (!token) {

            return new Response(
                JSON.stringify({
                    error:
                        "Invalid Authorization header",
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }

        console.log(
            "🔐 Authorization token received"
        );

        // --------------------------------------------------
        // Verify logged-in user
        // --------------------------------------------------

        const {
            data: userData,
            error: userError,
        } =
            await supabaseAdmin.auth.getUser(
                token
            );

        if (userError) {

            console.log(
                "❌ JWT verification failed:",
                userError.message
            );

            return new Response(
                JSON.stringify({
                    error:
                        "Invalid or expired login session",
                    details:
                        userError.message,
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }

        const user =
            userData.user;

        if (!user) {

            return new Response(
                JSON.stringify({
                    error:
                        "Logged-in user not found",
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }

        console.log(
            "👤 Logged-in user:",
            user.id
        );

        // --------------------------------------------------
        // Check staff
        // --------------------------------------------------

        const {
            data: staff,
            error: staffError,
        } =
            await supabaseAdmin
                .from("staff")
                .select(
                    "id, username, dept, role"
                )
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();

        if (staffError) {

            console.log(
                "❌ Staff lookup error:",
                staffError.message
            );

            return new Response(
                JSON.stringify({
                    error:
                        "Could not verify staff account",
                    details:
                        staffError.message,
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }

        if (!staff) {

            console.log(
                "❌ User is not in staff table"
            );

            return new Response(
                JSON.stringify({
                    error:
                        "Only staff can create students",
                }),
                {
                    status: 403,
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }

        if (staff.role !== "staff") {

            console.log(
                "❌ User does not have staff role:",
                staff.role
            );

            return new Response(
                JSON.stringify({
                    error:
                        "You do not have permission to create students",
                }),
                {
                    status: 403,
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }

        console.log(
            "✅ Staff verified:",
            staff.username
        );

        // --------------------------------------------------
        // Read student data
        // --------------------------------------------------

        const body =
            await req.json();

        const {
            full_name,
            email,
            department,
            course,
            division,
            semester,
        } = body;

        console.log(
            "📋 Student data received:",
            {
                full_name,
                email,
                department,
                course,
                division,
                semester,
            }
        );

        // --------------------------------------------------
        // Validate
        // --------------------------------------------------

        if (!full_name?.trim()) {
            return new Response(
                JSON.stringify({
                    error:
                        "Student name is required",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }

        if (!email?.trim()) {
            return new Response(
                JSON.stringify({
                    error:
                        "Student email is required",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }

        if (!department) {
            return new Response(
                JSON.stringify({
                    error:
                        "Department is required",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }

        if (!course) {
            return new Response(
                JSON.stringify({
                    error:
                        "Course is required",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }

        if (!division) {
            return new Response(
                JSON.stringify({
                    error:
                        "Division is required",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }

        if (
            semester === undefined ||
            semester === null ||
            Number.isNaN(Number(semester))
        ) {
            return new Response(
                JSON.stringify({
                    error:
                        "Semester is required",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }

        // --------------------------------------------------
        // Generate temporary password
        // --------------------------------------------------

        const temporaryPassword =
            crypto.randomUUID()
                .replaceAll("-", "")
                .slice(0, 10) + "Aa1!";

        console.log(
            "🔑 Temporary password generated"
        );

        // --------------------------------------------------
        // Create Auth user
        // --------------------------------------------------

        const {
            data: authData,
            error: authError,
        } =
            await supabaseAdmin.auth.admin
                .createUser({
                    email:
                        email.trim()
                            .toLowerCase(),

                    password:
                        temporaryPassword,

                    email_confirm:
                        true,

                    user_metadata: {
                        full_name:
                            full_name.trim(),

                        role: "student",
                    },
                });

        if (authError) {

            console.log(
                "❌ Auth user creation failed:",
                authError.message
            );

            return new Response(
                JSON.stringify({
                    error:
                        authError.message,
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }

        if (!authData.user) {

            return new Response(
                JSON.stringify({
                    error:
                        "Auth user was not created",
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }

        const studentId =
            authData.user.id;

        console.log(
            "✅ Auth user created:",
            studentId
        );

        // --------------------------------------------------
        // Insert student
        // --------------------------------------------------

        const {
            data: student,
            error: studentError,
        } =
            await supabaseAdmin
                .from("students")
                .insert({
                    id: studentId,

                    full_name:
                        full_name.trim(),

                    email:
                        email.trim()
                            .toLowerCase(),

                    department,

                    course,

                    division,

                    semester:
                        Number(semester),

                    role: "student",
                })
                .select(
                    "id, admission_no, roll_no, full_name, email, department, course, division, semester, role"
                )
                .single();

        // --------------------------------------------------
        // If database insert fails,
        // delete Auth user
        // --------------------------------------------------

        if (studentError) {

            console.log(
                "❌ Student insert failed:",
                studentError.message
            );

            console.log(
                "🗑️ Removing Auth user..."
            );

            await supabaseAdmin.auth.admin
                .deleteUser(
                    studentId
                );

            return new Response(
                JSON.stringify({
                    error:
                        "Could not create student record",
                    details:
                        studentError.message,
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }

        console.log(
            "✅ Student created:",
            student.admission_no
        );

        // --------------------------------------------------
        // Success
        // --------------------------------------------------

        return new Response(
            JSON.stringify({
                success: true,

                message:
                    "Student created successfully",

                student: {
                    id:
                        student.id,

                    admission_no:
                        student.admission_no,

                    roll_no:
                        student.roll_no,

                    full_name:
                        student.full_name,

                    email:
                        student.email,

                    department:
                        student.department,

                    course:
                        student.course,

                    division:
                        student.division,

                    semester:
                        student.semester,

                    role:
                        student.role,
                },

                temporary_password:
                    temporaryPassword,
            }),
            {
                status: 200,

                headers: {
                    "Content-Type":
                        "application/json",
                },
            }
        );

    } catch (error) {

        console.error(
            "🔥 Unexpected error:",
            error
        );

        return new Response(
            JSON.stringify({
                error:
                    "Internal server error",

                details:
                    error instanceof Error
                        ? error.message
                        : String(error),
            }),
            {
                status: 500,

                headers: {
                    "Content-Type":
                        "application/json",
                },
            }
        );
    }
});