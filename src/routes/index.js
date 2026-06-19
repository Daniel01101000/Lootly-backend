const { Router } = require('express');
const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const wishlistRoutes = require('./wishlist.routes');
const cartRoutes = require('./cart.routes');
const alertRoutes = require('./alert.routes');
const userRoutes = require('./user.routes');
const scraperRoutes = require('../scraper/scraper.routes');
const integrationRoutes = require('../integrations/integration.routes');
const adminRoutes = require('./admin.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/cart', cartRoutes);
router.use('/alerts', alertRoutes);
router.use('/users', userRoutes);
router.use('/scraper', scraperRoutes);
router.use('/integrations', integrationRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
