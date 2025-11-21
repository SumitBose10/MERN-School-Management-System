// ...existing code...
const bcrypt = require('bcrypt');
const Admin = require('../models/adminSchema.js');
const Sclass = require('../models/sclassSchema.js');
const Student = require('../models/studentSchema.js');
const Teacher = require('../models/teacherSchema.js');
const Subject = require('../models/subjectSchema.js');
const Notice = require('../models/noticeSchema.js');
const Complain = require('../models/complainSchema.js');

const adminRegister = async (req, res) => {
    try {
        const { email, password, schoolName } = req.body;
        if (!email || !password) {
            return res.status(400).send({ message: 'Email and password are required' });
        }

        const existingAdminByEmail = await Admin.findOne({ email });
        if (existingAdminByEmail) {
            return res.status(409).send({ message: 'Email already exists' });
        }

        const existingSchool = await Admin.findOne({ schoolName });
        if (existingSchool) {
            return res.status(409).send({ message: 'School name already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(password, salt);

        const admin = new Admin({
            ...req.body,
            password: hashedPass
        });

        let result = await admin.save();
        result.password = undefined;
        res.status(201).send(result);
    } catch (err) {
        res.status(500).json({ error: err.message || err });
    }
};

const adminLogIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send({ message: 'Email and password are required' });
        }

        let admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).send({ message: 'User not found' });
        }

        const validated = await bcrypt.compare(password, admin.password);
        if (!validated) {
            return res.status(401).send({ message: 'Invalid password' });
        }

        admin.password = undefined;
        res.send(admin);
    } catch (err) {
        res.status(500).json({ error: err.message || err });
    }
};

const getAdminDetail = async (req, res) => {
    try {
        let admin = await Admin.findById(req.params.id);
        if (!admin) {
            return res.status(404).send({ message: 'No admin found' });
        }
        admin.password = undefined;
        res.send(admin);
    } catch (err) {
        res.status(500).json({ error: err.message || err });
    }
};

const deleteAdmin = async (req, res) => {
    try {
        const result = await Admin.findByIdAndDelete(req.params.id);

        await Sclass.deleteMany({ school: req.params.id });
        await Student.deleteMany({ school: req.params.id });
        await Teacher.deleteMany({ school: req.params.id });
        await Subject.deleteMany({ school: req.params.id });
        await Notice.deleteMany({ school: req.params.id });
        await Complain.deleteMany({ school: req.params.id });

        res.send(result);
    } catch (error) {
        res.status(500).json({ error: error.message || error });
    }
};

const updateAdmin = async (req, res) => {
    try {
        const update = { ...req.body };
        if (update.password) {
            const salt = await bcrypt.genSalt(10);
            update.password = await bcrypt.hash(update.password, salt);
        }
        let result = await Admin.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });

        if (!result) return res.status(404).send({ message: 'Admin not found' });

        result.password = undefined;
        res.send(result);
    } catch (error) {
        res.status(500).json({ error: error.message || error });
    }
};

module.exports = { adminRegister, adminLogIn, getAdminDetail, deleteAdmin, updateAdmin };
// ...existing code...