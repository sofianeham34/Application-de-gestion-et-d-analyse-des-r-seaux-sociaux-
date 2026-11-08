const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const userController = {
    // Inscription
    register: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { username, email, password } = req.body;

            // Vérifier si l'utilisateur existe déjà
            let user = await User.findOne({ $or: [{ email }, { username }] });
            if (user) {
                return res.status(400).json({ message: 'Utilisateur déjà existant' });
            }

            // Hasher le mot de passe
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = new User({
                username,
                email,
                password: hashedPassword
            });

            await user.save();

            // Créer le token JWT
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            const userResponse = user.toObject();
            delete userResponse.password;

            res.status(201).json({
                user: userResponse,
                token
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur serveur' });
        }
    },

    // Connexion
    login: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password } = req.body;
            // Connexion par email ou par nom d'utilisateur
            const user = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: email }] });

            // Même message dans les deux cas pour ne pas révéler quels comptes existent
            const isMatch = user && user.isActive && await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Identifiants invalides' });
            }
            // Créer le token JWT
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            const userResponse = user.toObject();
            delete userResponse.password;
            res.json({
                user: userResponse,
                token
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur serveur' });
        }
    },

    // Récupérer tous les utilisateurs (protégé, admin seulement)
    getAllUsers: async (req, res) => {
        try {
            const allUser = await User.find().select('-password');
            res.json(allUser);
        } catch (error) {
            res.status(500).json({ error: 'Erreur serveur' });
        }
    },

    // Récupérer un utilisateur par ID (protégé)
    getUserById: async (req, res) => {
        try {
            const user = await User.findById(req.params.id).select('-password');
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            // Vérifier si l'utilisateur demande ses propres informations ou est admin
            if (req.user.id !== user._id.toString() && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Accès non autorisé' });
            }

            res.json(user);
              
        } catch (error) {
            res.status(500).json({ error: 'Erreur serveur' });
        }
    },

    // Mettre à jour un utilisateur (protégé)
    updateUser: async (req, res) => {
        try {
            // Vérifier si l'utilisateur met à jour son propre profil ou est admin
            if (req.user.id !== req.params.id && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Accès non autorisé' });
            }

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Seuls ces champs sont modifiables : impossible de changer son rôle ou son statut
            const updates = {};
            for (const field of ['username', 'email', 'password']) {
                if (req.body[field] !== undefined) updates[field] = req.body[field];
            }
            updates.updatedAt = Date.now();

            // Si le mot de passe est mis à jour, le hasher
            if (updates.password) {
                const salt = await bcrypt.genSalt(10);
                updates.password = await bcrypt.hash(updates.password, salt);
            }

            const user = await User.findByIdAndUpdate(
                req.params.id,
                { $set: updates },
                { new: true, runValidators: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            res.json(user);
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({ message: 'Ce nom d\'utilisateur ou cet email est déjà utilisé' });
            }
            res.status(400).json({ error: 'Mise à jour impossible' });
        }
    },

    // Supprimer un utilisateur (protégé, admin seulement)
    deleteUser: async (req, res) => {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Accès non autorisé' });
            }

            const user = await User.findByIdAndDelete(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            res.json({ message: 'Utilisateur supprimé avec succès' });
        } catch (error) {
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
};

module.exports = userController;
