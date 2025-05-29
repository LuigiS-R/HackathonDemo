const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const {PDFDocument} = require("pdf-lib");
const db = require("./db/database");
const axios = require("axios");
const FormData = require("form-data")

const app = express();

app.use(express.static(path.join(__dirname, "public")));

class Student{
    constructor(id, name, score){
        this.id = id;
        this.name = name;
        this.score = score
    }
}

//Creating disk storage for grading exam documents upload
const answerKeyStorage = multer.diskStorage({
    destination: "./answerKey",
    filename: (req, file, cb) =>{
            cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
        }
})

const studentExamStorage = multer.diskStorage({
    destination: "./examPapers",
    filename: (req, file, cb) =>{
            cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
        }
})

//Creating disk storage for generating exam documents upload
const lectureMaterials = multer.diskStorage({
    destination: "./lectureMaterials",
    filename: (req, file, cb) =>{
            cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
        }
})

//Initializing multer objects
const uploadAnswerKey = multer({storage: answerKeyStorage});
const uploadStudentExam = multer({storage: studentExamStorage});
const uploadLectureMaterials = multer({storage: lectureMaterials});

app.get("/", (req, res) =>{

})

let answerKeyFilePath = null;

app.post("/answerKey/upload", uploadAnswerKey.single("answerKey"), (req, res) => {
    answerKeyFilePath = req.file.path;
    res.end();
})


app.post("/examPapers/upload", uploadStudentExam.array("examPapers", 60), async (req, res) => {
    if (!answerKeyFilePath) {
        return res.status(400).send("Answer key not uploaded yet");
    }

    const answerKeyStream = fs.createReadStream(answerKeyFilePath);
    let finalArray = []

    for(const file of req.files){
        const file_ = fs.createReadStream(file.path);
        //Making post request to grading module
        const form = new FormData();
        form.append("student_file", file_);
        form.append("answer_key", answerKeyStream);
        let response = await axios.post("https://daic-ai-got-this.onrender.com/grade", form, {
            headers:{
                ...form.getHeaders()
            },
        })
        
        let score = 0;
        for(const question of response.data){
            score += question.score;
        }
        
        const personToAdd = new Student(Date.now(), "name", score);
        finalArray.push(personToAdd);
    }
    for(const student of finalArray){
        db.run("INSERT INTO scores (id, name, score) VALUES (?, ?, ?)", [student.id, student.name, student.score], (err) =>{
            if (err){
                res.send("ERROR");
            }
        })
    }
    console.log("Database completed");
    res.send(finalArray);
})

app.get("/scores/check", (req, res) =>{
    let obj = {};
    db.all("SELECT * FROM scores", [], (err, rows) =>{
        res.json(rows);
    })
    
})

// My code: endpoint to generate exam questions based on lecture materials
app.post("/lectureMaterials/upload", uploadLectureMaterials.array("lectureMaterials", 30), async (req, res) => {
    try {
        const filePaths = [];
        const questionSettings = {};

        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const fileName = path.basename(file.path);

            filePaths.push(fileName);
            questionSettings[i + 1] = { mcq: 3, tf: 2, sa: 1, num: 0 };
        }

        const response = await axios.post("https://daic-ai-got-this.onrender.com/generate_exam", {
            file_paths: filePaths,
            detail_level: "short",
            question_settings: questionSettings
        });

        if (response.status !== 200) {
            throw new Error("Failed to generate exam questions");
        }

        res.status(200).json({ message: "Exam generated successfully", exam: response.data });
    } catch (error) {
        console.error("Exam generation error:", error);
        res.status(500).json({ error: error.message });
    }
});


app.post("/users", (req, res) =>{
    db.run("INSERT INTO users (id, name, email, password) values (?, ?, ?, ?)", [req.body.id, req.body.name, req.body.email, req.body.password], (err) =>{
        if (err){
            res.send("Error at insertion operation");
        }
        else{
            res.send("Succesful insertion");
        }
    })
})

app.post("/login", (req, res) =>{
    const id = req.body.id;
    const password = req.body.password;

    db.get("SELECT * FROM users WHERE id = (?)", [id], (err, row)=>{
        if (!row){
            res.send("Not found");
        }
        else{
            if (row.password != password){
                res.send("Not found");
            }
        }
    })
})

app.listen(3000, (req, res)=>{
    console.log("App listening at 3000");
})
