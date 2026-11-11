
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const pool = require("./config/db");

const express = require("express")
const app = express() ; 
app.use(express.json()); 

// Validation helpers

const validStatuses = ["Applied", "Interview", "Offer", "Rejected"];
const validInterviewResults = ["Scheduled", "Passed", "Failed"];

const isNonEmptyString = (value) => {
    return typeof value === "string" && value.trim().length > 0;
};

const isValidUUID = (value) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
};

// Validate all route parameters named :id
app.param("id", (req, res, next, id) => {
    if (!isValidUUID(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
    }
    next();
});

// Validate note IDs
app.param("noteId", (req, res, next, id) => {
    if (!isValidUUID(id)) {
        return res.status(400).json({ error: "Invalid note ID format" });
    }
    next();
});

app.use("/api/auth", authRoutes);
app.use("/api/applications", authMiddleware);
 
// pool.query("SELECT NOW()")
//     .then((result) => {
//         console.log("Database connected successfully!");
//         console.log(result.rows[0]);
//     })
//     .catch((err) => {
//         console.error("Database connection failed:", err.message);
//     });

app.get("/api/health",(req,res)=>{
    res.status(200).json({
        status:"OK",
        message:"Jobtrack API is running"
    });
});
app.get("/api/auth/profile", authMiddleware, (req, res) => {
    res.status(200).json({
        message: "Authenticated successfully",
        user: req.user
    });
});

 app.get("/api/applications/:id", async (req, res,next) => {
    try {
        const { id } = req.params;

       const result = await pool.query(
    "SELECT * FROM applications WHERE id = $1 AND user_id = $2",
    [id, req.user.id]
);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Application not found"
            });
        }

        res.status(200).json({
            application: result.rows[0]
        });

    } catch (err) {
    next(err);
}
});


app.patch("/api/applications/:id", async (req, res,next) => {
    try {
        const { id } = req.params;
        const { company, role, status, job_url } = req.body;

        if (
    company === undefined &&
    role === undefined &&
    status === undefined &&
    job_url === undefined
) {
    return res.status(400).json({
        error: "At least one field is required for update"
    });
}

if (company !== undefined && !isNonEmptyString(company)) {
    return res.status(400).json({
        error: "Invalid company name"
    });
}

if (role !== undefined && !isNonEmptyString(role)) {
    return res.status(400).json({
        error: "Invalid role"
    });
}

if (status !== undefined && !validStatuses.includes(status)) {
    return res.status(400).json({
        error: "Invalid application status"
    });
}

        const result = await pool.query(
    `UPDATE applications
     SET company = COALESCE($1, company),
         role = COALESCE($2, role),
         status = COALESCE($3, status),
         job_url = COALESCE($4, job_url),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5 AND user_id = $6
     RETURNING *`,
    [company, role, status, job_url, id, req.user.id]
);
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Application not found"
            });
        }

        res.status(200).json({
            message: "Application updated successfully",
            application: result.rows[0]
        });

    } catch (err) {
    next(err);
}
});


app.delete("/api/applications/:id", async (req, res,next) => {
    try {
        const { id } = req.params;

       const result = await pool.query(
    "DELETE FROM applications WHERE id = $1 AND user_id = $2 RETURNING *",
    [id, req.user.id]
);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Application not found"
            });
        }

        res.status(200).json({
            message: "Application deleted successfully",
            application: result.rows[0]
        });

    } catch (err) {
    next(err);
}
});
// Route 2 : Filter Applications 
// app.get("/api/applications",(req,res)=>{
//     const {status,page} = req.query; 

//     res.json({
//         status:status||"All",
//         page:page||1
//     }); 
// }) ; 

// Route 3 : Create application
//let nextId = 4 ; 
// app.post("/api/applications", (req,res)=>{
//     const {company , role, status} = req.body ; 
    
//     // validate required fields
//     if(!company || !role){
//         return res.status(400).json({
//             error : "Company and role are required"
//         }) ; 
//     }

//     const newApplication = {
//         id:nextId++,
//         company,
//         role,
//         status : status||"Applied"
//     };

//     applications.push(newApplication) ;

//     res.status(201).json({
//         message:"Application created successfully",
//         // application:{
//         //  company,
//         //  role, 
//         //  status
//         // }
//         application:newApplication
//     });
// }); 
 

app.post("/api/applications", async (req, res,next) => {
    try {
        const { company, role, status, job_url } = req.body;

        // if (!company || !role) {
        //     return res.status(400).json({
        //         error: "Company and role are required"
        //     });
        // }
        if (!isNonEmptyString(company) || !isNonEmptyString(role)) {
    return res.status(400).json({
        error: "Valid company and role are required"
    });
}

if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
        error: "Invalid application status"
    });
}

       const result = await pool.query(
    `INSERT INTO applications (company, role, status, job_url, user_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [company, role, status || "Applied", job_url || null, req.user.id]
);

        res.status(201).json({
            message: "Application created successfully",
            application: result.rows[0]
        });

    } catch (err) {
    next(err);
}
});


// app.get("/api/applications", (req,res)=>{

//     const {status , company}= req.query;  
    
//     let filteredApplications = applications ; 

//     if(status) {
//         filteredApplications = applications.filter((app)=>{
//         return app.status.toLowerCase() === status.toLowerCase(); 
//         });
//     }
//     if(company){
//         filteredApplications = filteredApplications.filter((app)=>{  // here we are using fileredApplication array imp ; 
//             return app.company.toLowerCase() == company.toLowerCase()
//         });
//     }

//     res.status(200).json({
//         count:filteredApplications.length,
//         applications:filteredApplications
//     });
// }); 
app.get("/api/applications", async (req, res,next) => {
    try {
        const { status, company } = req.query;

        let query = "SELECT * FROM applications WHERE user_id = $1";
        let values = [req.user.id];

        if (status) {
            values.push(status);
            query += ` AND LOWER(status) = LOWER($${values.length})`;
        }

        if (company) {
            values.push(company);
            query += ` AND LOWER(company) = LOWER($${values.length})`;
        }

        query += " ORDER BY created_at DESC";

        const result = await pool.query(query, values);

        res.status(200).json({
            count: result.rows.length,
            applications: result.rows
        });

    } catch (err) {
    next(err);
}
});
app.get("/api/dashboard/stats", authMiddleware, async (req, res,next) => {
    try {
        const result = await pool.query(
            `SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE LOWER(status) = 'applied') AS applied,
                COUNT(*) FILTER (WHERE LOWER(status) = 'interview') AS interviews,
                COUNT(*) FILTER (WHERE LOWER(status) = 'offer') AS offers,
                COUNT(*) FILTER (WHERE LOWER(status) = 'rejected') AS rejected
             FROM applications
             WHERE user_id = $1`,
            [req.user.id]
        );

        res.status(200).json({
            stats: result.rows[0]
        });

    } catch (err) {
    next(err);
}
});


// CREATE INTERVIEW
app.post("/api/interviews", authMiddleware, async (req, res,next) => {
    try {
        const { application_id, round, scheduled_at, mode, notes } = req.body;

        if (!isValidUUID(application_id)) {
    return res.status(400).json({
        error: "Invalid application ID"
    });
}

if (!isNonEmptyString(round)) {
    return res.status(400).json({
        error: "Valid interview round is required"
    });
}

if (mode !== undefined && mode !== null && !isNonEmptyString(mode)) {
    return res.status(400).json({
        error: "Invalid interview mode"
    });
}

if (scheduled_at && isNaN(Date.parse(scheduled_at))) {
    return res.status(400).json({
        error: "Invalid interview date"
    });
}

if (notes !== undefined && notes !== null && typeof notes !== "string") {
    return res.status(400).json({
        error: "Notes must be a string"
    });
}

        const result = await pool.query(
            `INSERT INTO interviews (application_id, round, scheduled_at, mode, notes)
             SELECT id, $2, $3, $4, $5
             FROM applications
             WHERE id = $1 AND user_id = $6
             RETURNING *`,
            [application_id, round, scheduled_at || null, mode || null, notes || null, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Application not found"
            });
        }

        res.status(201).json({
            message: "Interview scheduled successfully",
            interview: result.rows[0]
        });

    } catch (err) {
    next(err);
}
});


// GET ALL INTERVIEWS
app.get("/api/interviews", authMiddleware, async (req, res,next) => {
    try {
        const result = await pool.query(
            `SELECT i.*, a.company, a.role
             FROM interviews i
             JOIN applications a ON i.application_id = a.id
             WHERE a.user_id = $1
             ORDER BY i.scheduled_at ASC NULLS LAST`,
            [req.user.id]
        );

        res.status(200).json({
            count: result.rows.length,
            interviews: result.rows
        });

    } catch (err) {
    next(err);
}
});


// UPDATE INTERVIEW
app.patch("/api/interviews/:id", authMiddleware, async (req, res,next) => {
    try {
        const { id } = req.params;
        const { round, scheduled_at, mode, notes, result: interviewResult } = req.body;
        if (
    round === undefined &&
    scheduled_at === undefined &&
    mode === undefined &&
    notes === undefined &&
    interviewResult === undefined
) {
    return res.status(400).json({
        error: "At least one field is required for update"
    });
}

if (round !== undefined && !isNonEmptyString(round)) {
    return res.status(400).json({
        error: "Invalid interview round"
    });
}

if (mode !== undefined && mode !== null && !isNonEmptyString(mode)) {
    return res.status(400).json({
        error: "Invalid interview mode"
    });
}

if (scheduled_at !== undefined && scheduled_at !== null &&
    isNaN(Date.parse(scheduled_at))) {
    return res.status(400).json({
        error: "Invalid interview date"
    });
}

if (notes !== undefined && notes !== null && typeof notes !== "string") {
    return res.status(400).json({
        error: "Notes must be a string"
    });
}

if (interviewResult !== undefined &&
    !validInterviewResults.includes(interviewResult)) {
    return res.status(400).json({
        error: "Invalid interview result"
    });
}

        const updated = await pool.query(
            `UPDATE interviews i
             SET round = COALESCE($1, i.round),
                 scheduled_at = COALESCE($2, i.scheduled_at),
                 mode = COALESCE($3, i.mode),
                 notes = COALESCE($4, i.notes),
                 result = COALESCE($5, i.result)
             FROM applications a
             WHERE i.application_id = a.id
               AND a.user_id = $6
               AND i.id = $7
             RETURNING i.*`,
            [round, scheduled_at, mode, notes, interviewResult, req.user.id, id]
        );

        if (updated.rows.length === 0) {
            return res.status(404).json({ error: "Interview not found" });
        }

        res.status(200).json({
            message: "Interview updated successfully",
            interview: updated.rows[0]
        });

    } catch (err) {
    next(err);
}
});


// DELETE INTERVIEW
app.delete("/api/interviews/:id", authMiddleware, async (req, res,next) => {
    try {
        const { id } = req.params;

        const deleted = await pool.query(
            `DELETE FROM interviews i
             USING applications a
             WHERE i.application_id = a.id
               AND a.user_id = $1
               AND i.id = $2
             RETURNING i.*`,
            [req.user.id, id]
        );

        if (deleted.rows.length === 0) {
            return res.status(404).json({ error: "Interview not found" });
        }

        res.status(200).json({
            message: "Interview deleted successfully",
            interview: deleted.rows[0]
        });

    } catch (err) {
    next(err);
}
});


// ADD NOTE
app.post("/api/applications/:id/notes", authMiddleware, async (req, res,next) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: "Note content is required" });
        }

        const result = await pool.query(
            `INSERT INTO notes (application_id, content)
             SELECT id, $2 FROM applications
             WHERE id = $1 AND user_id = $3
             RETURNING *`,
            [id, content.trim(), req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Application not found" });
        }

        res.status(201).json({
            message: "Note added successfully",
            note: result.rows[0]
        });

    } catch (err) {
    next(err);
}
});


// GET NOTES
app.get("/api/applications/:id/notes", authMiddleware, async (req, res,next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT n.* FROM notes n
             JOIN applications a ON n.application_id = a.id
             WHERE a.id = $1 AND a.user_id = $2
             ORDER BY n.created_at DESC`,
            [id, req.user.id]
        );

        res.status(200).json({
            count: result.rows.length,
            notes: result.rows
        });

    } catch (err) {
    next(err);
}
});


// EDIT NOTE
app.patch("/api/applications/:id/notes/:noteId", authMiddleware, async (req, res,next) => {
    try {
        const { id, noteId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: "Note content is required" });
        }

        const result = await pool.query(
            `UPDATE notes n
             SET content = $1, updated_at = CURRENT_TIMESTAMP
             FROM applications a
             WHERE n.application_id = a.id
               AND a.id = $2
               AND a.user_id = $3
               AND n.id = $4
             RETURNING n.*`,
            [content.trim(), id, req.user.id, noteId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Note not found" });
        }

        res.status(200).json({
            message: "Note updated successfully",
            note: result.rows[0]
        });

    } catch (err) {
    next(err);
}
});


// DELETE NOTE
app.delete("/api/applications/:id/notes/:noteId", authMiddleware, async (req, res,next) => {
    try {
        const { id, noteId } = req.params;

        const result = await pool.query(
            `DELETE FROM notes n
             USING applications a
             WHERE n.application_id = a.id
               AND a.id = $1
               AND a.user_id = $2
               AND n.id = $3
             RETURNING n.*`,
            [id, req.user.id, noteId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Note not found" });
        }

        res.status(200).json({
            message: "Note deleted successfully",
            note: result.rows[0]
        });

    } catch (err) {
    next(err);
}
});


// GET APPLICATION STATUS HISTORY
app.get("/api/applications/:id/history", authMiddleware, async (req, res,next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT h.* FROM status_history h
             JOIN applications a ON h.application_id = a.id
             WHERE a.id = $1 AND a.user_id = $2
             ORDER BY h.changed_at ASC`,
            [id, req.user.id]
        );

        res.status(200).json({
            count: result.rows.length,
            history: result.rows
        });

    } catch (err) {
    next(err);
}
});




// Centralized error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(err.status || 500).json({
        error: err.message || "Internal server error"
    });
});
//const PORT = 3000; 

// const PORT = process.env.PORT || 3000;
// app.listen(PORT,()=>{
//     console.log(`Server running on port ${PORT}`) ; 
// });     
// const PORT = process.env.PORT || 3000;

// // Start server only when running directly
// if (require.main === module) {
//     app.listen(PORT, () => {
//         console.log(`Server running on port ${PORT}`);
//     });
// }

// module.exports = app;

const PORT = process.env.PORT || 3000;

// Start server only when running directly
if (require.main === module) {
    app.listen(PORT, async () => {
        console.log(`Server running on port ${PORT}`);

        try {
            const result = await pool.query("SELECT NOW()");
            console.log("Database connected successfully!");
            console.log(result.rows[0]);
        } catch (err) {
    console.error("Database connection failed!");
    console.error("Error name:", err.name);
    console.error("Error code:", err.code);
    console.error("Error message:", err.message);
    console.error("Error detail:", err.detail);
    console.error("Error stack:", err.stack);
    console.error("Underlying errors:", err.errors);
}
    });
}

module.exports = app;