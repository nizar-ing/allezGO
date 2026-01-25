import {
    FaPlane,
    FaFacebookF,
    FaTwitter,
    FaInstagram,
    FaLinkedinIn,
    FaYoutube,
    FaPhone,
    FaEnvelope,
    FaMapMarkerAlt,
    FaClock,
    FaCreditCard,
    FaShieldAlt,
    FaGlobe,
    FaHeart
} from 'react-icons/fa';

function Footer() {

    const footerLinks = {
        destinations: [
            'Europe', 'Asie', 'Afrique', 'Amérique', 'Océanie', 'Moyen-Orient'
        ],
        services: [
            'Réservation d\'hôtels', 'Vols', 'Voyages organisés', 'Croisières', 'Assurance voyage', 'Location de voiture'
        ],
        company: [
            'À propos', 'Carrières', 'Blog', 'Partenaires', 'Presse', 'Contactez-nous'
        ],
        support: [
            'Centre d\'aide', 'Conditions générales', 'Politique de confidentialité', 'FAQ', 'Remboursements', 'Réclamations'
        ]
    };

    const socialLinks = [
        {icon: FaFacebookF, label: 'Facebook', color: 'hover:bg-blue-600'},
        {icon: FaTwitter, label: 'Twitter', color: 'hover:bg-sky-500'},
        {icon: FaInstagram, label: 'Instagram', color: 'hover:bg-pink-600'},
        {icon: FaLinkedinIn, label: 'LinkedIn', color: 'hover:bg-blue-700'},
        {icon: FaYoutube, label: 'YouTube', color: 'hover:bg-red-600'}
    ];

    const paymentMethods = ['Visa', 'Mastercard', 'PayPal', 'Amex'];

    return (
        <footer className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
            {/* Decorative top border */}
            <div
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-orange-500 to-blue-500"></div>

            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                    {/* Company Info */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center space-x-2 mb-4 group cursor-pointer">
                            <div className="relative">
                                <FaPlane
                                    className="text-3xl text-orange-500 transform transition-transform duration-300 group-hover:translate-x-2 group-hover:rotate-12"
                                    style={{filter: 'drop-shadow(0 4px 6px rgba(249, 115, 22, 0.4))'}}
                                />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">
                                    <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Allez</span>
                                    <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">GO</span>
                                </h2>
                            </div>
                        </div>
                        <p className="text-gray-300 text-sm mb-4">
                            Votre partenaire de confiance pour des voyages inoubliables à travers le monde depuis 2020.
                        </p>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            <div
                                className="flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded backdrop-blur-sm">
                                <FaShieldAlt className="text-green-400"/>
                                <span>Paiement sécurisé</span>
                            </div>
                            <div
                                className="flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded backdrop-blur-sm">
                                <FaCreditCard className="text-blue-400"/>
                                <span>100% Garanti</span>
                            </div>
                        </div>

                        {/* Social Media */}
                        <div className="flex gap-2">
                            {socialLinks.map((social, index) => {
                                const Icon = social.icon;
                                return (
                                    <button
                                        key={index}
                                        aria-label={social.label}
                                        className={`w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110 ${social.color}`}
                                        style={{
                                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                                        }}
                                    >
                                        <Icon className="text-sm"/>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Destinations Populaires */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <FaGlobe className="text-orange-500"/>
                            Destinations
                        </h3>
                        <ul className="space-y-2">
                            {footerLinks.destinations.map((link, index) => (
                                <li key={index}>
                                    <a href="#"
                                       className="text-gray-300 hover:text-orange-400 transition-colors text-sm hover:translate-x-1 inline-block transform duration-200">
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Nos Services</h3>
                        <ul className="space-y-2">
                            {footerLinks.services.map((link, index) => (
                                <li key={index}>
                                    <a href="#"
                                       className="text-gray-300 hover:text-orange-400 transition-colors text-sm hover:translate-x-1 inline-block transform duration-200">
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Entreprise</h3>
                        <ul className="space-y-2">
                            {footerLinks.company.map((link, index) => (
                                <li key={index}>
                                    <a href="#"
                                       className="text-gray-300 hover:text-orange-400 transition-colors text-sm hover:translate-x-1 inline-block transform duration-200">
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact & Support */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Contact</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2 text-sm">
                                <FaMapMarkerAlt className="text-orange-500 mt-1 flex-shrink-0"/>
                                <span className="text-gray-300">123 Avenue des Voyages, Aîn Beida, Oum Bouaghi</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                                <FaPhone className="text-orange-500 flex-shrink-0"/>
                                <a href="tel:+213770932563"
                                   className="text-gray-300 hover:text-orange-400 transition-colors">
                                    +213 770 93 25 63
                                </a>
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                                <FaEnvelope className="text-orange-500 flex-shrink-0"/>
                                <a href="mailto:contact@allezgo.fr"
                                   className="text-gray-300 hover:text-orange-400 transition-colors">
                                    contact@allezgo.dz
                                </a>
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                                <FaClock className="text-orange-500 mt-1 flex-shrink-0"/>
                                <div className="text-gray-300">
                                    <div>Dim - Jeu: 9h - 19h</div>
                                    <div>Sam: 10h - 18h</div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="border-t border-white/10 pt-8 mb-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
                            <span className="text-sm text-gray-400">Moyens de paiement acceptés:</span>
                            <div className="flex gap-2">
                                {paymentMethods.map((method, index) => (
                                    <div
                                        key={index}
                                        className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded text-xs font-semibold"
                                        style={{
                                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                                        }}
                                    >
                                        {method}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <FaShieldAlt className="text-green-400"/>
                            <span>Transactions 100% sécurisées</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 pt-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-400">
                            © 2025 AllezGO Travel Agency. Tous droits réservés.
                        </p>
                        <div className="flex items-center gap-4 text-sm flex-wrap justify-center">
                            <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                                Conditions d'utilisation
                            </a>
                            <span className="text-gray-600">|</span>
                            <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                                Politique de confidentialité
                            </a>
                            <span className="text-gray-600">|</span>
                            <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                                Cookies
                            </a>
                        </div>
                    </div>
                    <div className="text-center mt-4">
                        <p className="text-xs text-white font-mono flex items-center justify-center gap-1">
                            Designed by <FaHeart className="text-red-500 animate-pulse"/> NIZAR ILAHI
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
