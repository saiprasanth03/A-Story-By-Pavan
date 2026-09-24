import express from 'express';
import Settings from '../models/Settings.js';
import { getMailer } from '../mailer.js';

const router = express.Router();

// Get settings
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne().lean();
    if (!settings) {
      settings = new Settings();
      await settings.save();
      settings = settings.toObject();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching settings' });
  }
});

// Update blocked weekdays and weekday capacities
router.put('/blocked-weekdays', async (req, res) => {
  try {
    const { blockedWeekdays, weekdayCapacities } = req.body;
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings({ blockedWeekdays, weekdayCapacities });
      await settings.save();
    } else {
      const updateData = {};
      if (blockedWeekdays !== undefined) updateData.blockedWeekdays = blockedWeekdays;
      if (weekdayCapacities !== undefined) updateData.weekdayCapacities = weekdayCapacities;
      
      await Settings.collection.updateOne(
        { _id: settings._id },
        { $set: updateData }
      );
    }
    
    // Return lean object so frontend gets a plain JS object map
    const savedSettings = await Settings.findById(settings._id).lean();
    res.json(savedSettings);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating blocked weekdays' });
  }
});

router.get('/debug', async (req, res) => {
  const settings = await Settings.findOne();
  res.json({ settings });
});

// Update analytics IDs
router.put('/analytics', async (req, res) => {
  try {
    const { metaPixelId, googleAnalyticsId } = req.body;
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings({ metaPixelId, googleAnalyticsId });
    } else {
      if (metaPixelId !== undefined) settings.metaPixelId = metaPixelId;
      if (googleAnalyticsId !== undefined) settings.googleAnalyticsId = googleAnalyticsId;
    }
    
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating analytics settings' });
  }
});

// Update contact details
router.put('/contact', async (req, res) => {
  try {
    const { contactEmail, whatsappNumber, contactNumber, teamEmails, portfolioReferrers, footerStudioAddress, footerSocials, displays } = req.body;
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings({ contactEmail, whatsappNumber, contactNumber, teamEmails, portfolioReferrers, footerStudioAddress, footerSocials, displays });
    } else {
      if (contactEmail !== undefined) settings.contactEmail = contactEmail;
      if (whatsappNumber !== undefined) settings.whatsappNumber = whatsappNumber;
      if (contactNumber !== undefined) settings.contactNumber = contactNumber;
      if (teamEmails !== undefined) settings.teamEmails = teamEmails;
      if (portfolioReferrers !== undefined) settings.portfolioReferrers = portfolioReferrers;
      if (footerStudioAddress !== undefined) settings.footerStudioAddress = footerStudioAddress;
      if (footerSocials !== undefined) settings.footerSocials = footerSocials;
      if (displays !== undefined) settings.displays = displays;
    }
    
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating contact settings' });
  }
});

// Update wedding page settings
router.put('/wedding', async (req, res) => {
  try {
    const { weddingHeroHeading, weddingHeroSubheading, weddingHeroDescription, weddingHeroButtonText, weddingHeroButtonLink, weddingHeroBackground } = req.body;
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings({ weddingHeroHeading, weddingHeroSubheading, weddingHeroDescription, weddingHeroButtonText, weddingHeroButtonLink, weddingHeroBackground });
    } else {
      if (weddingHeroHeading !== undefined) settings.weddingHeroHeading = weddingHeroHeading;
      if (weddingHeroSubheading !== undefined) settings.weddingHeroSubheading = weddingHeroSubheading;
      if (weddingHeroDescription !== undefined) settings.weddingHeroDescription = weddingHeroDescription;
      if (weddingHeroButtonText !== undefined) settings.weddingHeroButtonText = weddingHeroButtonText;
      if (weddingHeroButtonLink !== undefined) settings.weddingHeroButtonLink = weddingHeroButtonLink;
      if (weddingHeroBackground !== undefined) settings.weddingHeroBackground = weddingHeroBackground;
    }
    
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating wedding settings' });
  }
});
// Update maintenance mode
router.put('/maintenance', async (req, res) => {
  try {
    const { maintenanceMode, maintenanceEndTime } = req.body;
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings({ maintenanceMode, maintenanceEndTime });
    } else {
      if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
      if (maintenanceEndTime !== undefined) settings.maintenanceEndTime = maintenanceEndTime;
    }
    
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating maintenance mode' });
  }
});

// Update whatWeDo
router.put('/whatwedo', async (req, res) => {
  try {
    const { whatWeDo } = req.body;
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings({ whatWeDo });
    } else {
      if (whatWeDo !== undefined) settings.whatWeDo = whatWeDo;
    }
    
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating whatWeDo' });
  }
});

// Update predefined services
router.put('/predefined-services', async (req, res) => {
  try {
    const { predefinedServices, predefinedDeliverables, predefinedComplimentries } = req.body;
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings({ predefinedServices, predefinedDeliverables, predefinedComplimentries });
    } else {
      if (predefinedServices !== undefined) settings.predefinedServices = predefinedServices;
      if (predefinedDeliverables !== undefined) settings.predefinedDeliverables = predefinedDeliverables;
      if (predefinedComplimentries !== undefined) settings.predefinedComplimentries = predefinedComplimentries;
    }
    
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating predefined services' });
  }
});

// Update predefined options (deliverables and complimentries)
router.put('/predefined-options', async (req, res) => {
  try {
    const { predefinedDeliverables, predefinedComplimentries } = req.body;
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings({ predefinedDeliverables, predefinedComplimentries });
    } else {
      if (predefinedDeliverables !== undefined) settings.predefinedDeliverables = predefinedDeliverables;
      if (predefinedComplimentries !== undefined) settings.predefinedComplimentries = predefinedComplimentries;
    }
    
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating predefined options' });
  }
});

// Export Settings
router.get('/export', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Server error exporting settings' });
  }
});

// Test Email Setup
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(400).json({ success: false, error: 'Email credentials (EMAIL_USER / EMAIL_PASS) are not configured on the server.' });
    }

    const appName = process.env.APP_NAME || 'Studio OS';
    const transporter = getMailer();

    const info = await transporter.sendMail({
      from: `"${appName} Test" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${appName} - Email Configuration Test`,
      text: "If you are receiving this email, your Nodemailer configuration is working perfectly!"
    });

    res.json({ success: true, messageId: info.messageId, message: 'Test email sent successfully!' });
  } catch (error) {
    console.error("Test Email Error:", error);
    res.status(500).json({ success: false, error: error.message || 'Failed to send test email', stack: error.stack });
  }
});

export default router;
