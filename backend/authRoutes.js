const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "devsecret";


Router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    //Assuming db logins are used
    

    const token = jwt.sign(
        { id: 1, username },
        SECRET,
        { expiresIn: "1h" }
    );

    res.json({ token });
})