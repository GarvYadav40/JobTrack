
const request = require("supertest");
const app = require("../src/server");
const pool = require("../src/config/db");

const testEmail = `jobtrack.test.${Date.now()}@example.com`;
const secondEmail = `jobtrack.second.${Date.now()}@example.com`;
const testPassword = "TestPassword123";

let userToken;
let secondUserToken;
let applicationId;

let applicationCreateResponse;

let interviewId;
let interviewCreateResponse;

let noteId;
let noteCreateResponse;

describe("API Tests", () => {

    test("GET /api/health should return 200", async () => {
        const response = await request(app).get("/api/health");

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            status: "OK",
            message: "Jobtrack API is running"
        });
    });

    describe("Authentication Tests", () => {

        test("Should register a new user", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({
                    name: "Test User",
                    email: testEmail,
                    password: testPassword
                });

            expect(response.statusCode).toBe(201);
            expect(response.body.message).toBe("User registered successfully");
            expect(response.body.user.email).toBe(testEmail);
            expect(response.body.user).not.toHaveProperty("password_hash");
        });

        test("Should reject duplicate email registration", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({
                    name: "Test User",
                    email: testEmail,
                    password: testPassword
                });

            expect(response.statusCode).toBe(409);
            expect(response.body.error).toBe("Email already registered");
        });

        test("Should login with correct credentials", async () => {
            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email: testEmail,
                    password: testPassword
                });

            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe("Login successful");
            expect(response.body.token).toBeDefined();
            expect(response.body.user.email).toBe(testEmail);

            userToken = response.body.token;
        });

        test("Should reject incorrect password", async () => {
            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email: testEmail,
                    password: "WrongPassword123"
                });

            expect(response.statusCode).toBe(401);
            expect(response.body.error).toBe("Invalid email or password");
        });

    });

    describe("Protected Route Tests", () => {

        beforeAll(async () => {

            // Create second user
            await request(app)
                .post("/api/auth/register")
                .send({
                    name: "Second User",
                    email: secondEmail,
                    password: testPassword
                });

            // Login second user
            const loginResponse = await request(app)
                .post("/api/auth/login")
                .send({
                    email: secondEmail,
                    password: testPassword
                });

            secondUserToken = loginResponse.body.token;

            // Create application belonging to first user
            // applicationResponse = await request(app)
            //     .post("/api/applications")
            //     .set("Authorization", `Bearer ${userToken}`)
            //     .send({
            //         company: "Google",
            //         role: "SDE Intern",
            //         status: "Applied"
            //     });

            // applicationId = applicationResponse.body.application.id;
            applicationCreateResponse = await request(app)
            .post("/api/applications")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                company: "Google",
                role: "SDE Intern",
                status: "Applied"
            });

        applicationId = applicationCreateResponse.body.application.id;
        });

        test("Should reject access without token", async () => {
            const response = await request(app)
                .get(`/api/applications/${applicationId}`);

            expect(response.statusCode).toBe(401);
        });

        test("Should reject invalid token", async () => {
            const response = await request(app)
                .get(`/api/applications/${applicationId}`)
                .set("Authorization", "Bearer invalid.token.here");

            expect(response.statusCode).toBe(401);
        });

        test("Should allow user to access their own application", async () => {
            const response = await request(app)
                .get(`/api/applications/${applicationId}`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.application.id).toBe(applicationId);
            expect(response.body.application.company).toBe("Google");
        });

        test("Should prevent another user from accessing the application", async () => {
            const response = await request(app)
                .get(`/api/applications/${applicationId}`)
                .set("Authorization", `Bearer ${secondUserToken}`);

            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBe("Application not found");
        });

        test("Should create an application successfully", async () => {
            expect(applicationCreateResponse.statusCode).toBe(201);
            expect(applicationCreateResponse.body.application.company).toBe("Google");
        });

        test("Should update an application successfully", async () => {
            const response = await request(app)
                .patch(`/api/applications/${applicationId}`)
                .set("Authorization", `Bearer ${userToken}`)
                .send({
                    company: "Microsoft",
                    role: "SDE Intern"
                });

            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe("Application updated successfully");
            expect(response.body.application.company).toBe("Microsoft");
        });

        test("Should reject invalid application status", async () => {
            const response = await request(app)
                .patch(`/api/applications/${applicationId}`)
                .set("Authorization", `Bearer ${userToken}`)
                .send({
                    status: "Random"
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe("Invalid application status");
        });

        test("Should reject an empty update request", async () => {
            const response = await request(app)
                .patch(`/api/applications/${applicationId}`)
                .set("Authorization", `Bearer ${userToken}`)
                .send({});

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe("At least one field is required for update");
        });

        test("Should reject an invalid application ID", async () => {
            const response = await request(app)
                .get("/api/applications/invalid-id")
                .set("Authorization", `Bearer ${userToken}`);

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe("Invalid ID format");
        });
         

        test("Should create an interview successfully", async () => {
            interviewCreateResponse = await request(app)
                .post("/api/interviews")
                .set("Authorization", `Bearer ${userToken}`)
                .send({
                    application_id: applicationId,
                    round: "Technical Interview",
                    scheduled_at: "2026-12-01T10:00:00",
                    mode: "Online",
                    notes: "Prepare DSA"
                });

            interviewId = interviewCreateResponse.body.interview.id;

            expect(interviewCreateResponse.statusCode).toBe(201);
            expect(interviewCreateResponse.body.message).toBe("Interview scheduled successfully");
            expect(interviewCreateResponse.body.interview.round).toBe("Technical Interview");
        });

        test("Should reject an invalid application ID when creating interview", async () => {
            const response = await request(app)
                .post("/api/interviews")
                .set("Authorization", `Bearer ${userToken}`)
                .send({
                    application_id: "invalid-id",
                    round: "Technical Interview"
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe("Invalid application ID");
        });

        test("Should reject an invalid interview round", async () => {
            const response = await request(app)
                .post("/api/interviews")
                .set("Authorization", `Bearer ${userToken}`)
                .send({
                    application_id: applicationId,
                    round: ""
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe("Valid interview round is required");
        });

        test("Should fetch all interviews for the logged-in user", async () => {
            const response = await request(app)
                .get("/api/interviews")
                .set("Authorization", `Bearer ${userToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.interviews.length).toBeGreaterThan(0);
            expect(response.body.interviews.some(i => i.id === interviewId)).toBe(true);
        });

        test("Should update an interview successfully", async () => {
            const response = await request(app)
                .patch(`/api/interviews/${interviewId}`)
                .set("Authorization", `Bearer ${userToken}`)
                .send({
                    round: "Final Interview",
                    notes: "Prepare system design"
                });

            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe("Interview updated successfully");
            expect(response.body.interview.round).toBe("Final Interview");
        });

        test("Should reject an empty interview update", async () => {
            const response = await request(app)
                .patch(`/api/interviews/${interviewId}`)
                .set("Authorization", `Bearer ${userToken}`)
                .send({});

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe("At least one field is required for update");
        });

        test("Should prevent another user from updating the interview", async () => {
            const response = await request(app)
                .patch(`/api/interviews/${interviewId}`)
                .set("Authorization", `Bearer ${secondUserToken}`)
                .send({
                    round: "Unauthorized Update"
                });

            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBe("Interview not found");
        });

        test("Should delete an interview successfully", async () => {
            const response = await request(app)
                .delete(`/api/interviews/${interviewId}`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe("Interview deleted successfully");
        });
                 
test("Should create a note successfully", async () => {
    noteCreateResponse = await request(app)
        .post(`/api/applications/${applicationId}/notes`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
            content: "Prepare DSA for Google interview"
        });

    noteId = noteCreateResponse.body.note.id;

    expect(noteCreateResponse.statusCode).toBe(201);
    expect(noteCreateResponse.body.message).toBe("Note added successfully");
    expect(noteCreateResponse.body.note.content).toBe("Prepare DSA for Google interview");
});

test("Should reject an empty note", async () => {
    const response = await request(app)
        .post(`/api/applications/${applicationId}/notes`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
            content: "   "
        });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Note content is required");
});

test("Should fetch all notes for an application", async () => {
    const response = await request(app)
        .get(`/api/applications/${applicationId}/notes`)
        .set("Authorization", `Bearer ${userToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.count).toBeGreaterThan(0);
    expect(response.body.notes.some(n => n.id === noteId)).toBe(true);
});

test("Should update a note successfully", async () => {
    const response = await request(app)
        .patch(`/api/applications/${applicationId}/notes/${noteId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
            content: "Prepare DSA and system design"
        });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Note updated successfully");
    expect(response.body.note.content).toBe("Prepare DSA and system design");
});

test("Should reject an empty note update", async () => {
    const response = await request(app)
        .patch(`/api/applications/${applicationId}/notes/${noteId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
            content: ""
        });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Note content is required");
});

test("Should prevent another user from updating the note", async () => {
    const response = await request(app)
        .patch(`/api/applications/${applicationId}/notes/${noteId}`)
        .set("Authorization", `Bearer ${secondUserToken}`)
        .send({
            content: "Unauthorized modification"
        });

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Note not found");
});

test("Should delete a note successfully", async () => {
    const response = await request(app)
        .delete(`/api/applications/${applicationId}/notes/${noteId}`)
        .set("Authorization", `Bearer ${userToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Note deleted successfully");
});


test("Should record initial application status in history", async () => {
    const response = await request(app)
        .get(`/api/applications/${applicationId}/history`)
        .set("Authorization", `Bearer ${userToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.count).toBeGreaterThan(0);

    expect(
        response.body.history.some(h => h.new_status === "Applied")
    ).toBe(true);
});

test("Should record status changes in history", async () => {
    const updateResponse = await request(app)
        .patch(`/api/applications/${applicationId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
            status: "Interview"
        });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.application.status).toBe("Interview");

    const historyResponse = await request(app)
        .get(`/api/applications/${applicationId}/history`)
        .set("Authorization", `Bearer ${userToken}`);

    expect(
        historyResponse.body.history.some(
            h => h.old_status === "Applied" && h.new_status === "Interview"
        )
    ).toBe(true);
});

test("Should fetch application status history", async () => {
    const response = await request(app)
        .get(`/api/applications/${applicationId}/history`)
        .set("Authorization", `Bearer ${userToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.count).toBeGreaterThanOrEqual(2);
    expect(response.body.history.length).toBe(response.body.count);
});

test("Should prevent another user from accessing application history", async () => {
    const response = await request(app)
        .get(`/api/applications/${applicationId}/history`)
        .set("Authorization", `Bearer ${secondUserToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.count).toBe(0);
    expect(response.body.history).toHaveLength(0);
});

        test("Should delete an application successfully", async () => {
            const response = await request(app)
                .delete(`/api/applications/${applicationId}`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe("Application deleted successfully");
        });


    });

    afterAll(async () => {
        try {
            await pool.query(
                "DELETE FROM users WHERE email IN ($1, $2)",
                [testEmail, secondEmail]
            );
        } finally {
            await pool.end();
        }
    });

});
