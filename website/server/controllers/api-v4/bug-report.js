import nconf from 'nconf';
import { authWithHeaders } from '../../middlewares/auth';
import { sendTxn } from '../../libs/email';

const api = {};

/**
 * @api {post} /api/v4/bug-report Report an issue
 * @apiName BugReport
 * @apiGroup BugReport
 * @apiDescription This POST method is used to send bug reports from the Website.
 * Since it needs the Users Data, it requires authentication.
 *
 * @apiParam (Body) {String} message Bug Report Message to sent
 *
 * @apiSuccess {Object} data Result of this bug report
 * @apiSuccess {Boolean} data.ok Status of this report
 * @apiSuccess {String} data.message Status of this report
 *
 * @apiError (400) {BadRequest} emptyReportBugMessage The report message is missing.
 * @apiUse UserNotFound
 */
api.bugReport = {
  method: 'POST',
  url: '/bug-report',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    req.checkBody({
      message: {
        notEmpty: { errorMessage: res.t('emptyReportBugMessage') },
      },
    });
    const validationErrors = req.validationErrors();
    if (validationErrors) throw validationErrors;

    const { message } = req.body;

    const { user } = res.locals;

    const emailData = {
      USER_ID: user._id,
      USER_LEVEL: user.stats.lvl,
      USER_CLASS: user.stats.class,
      USER_DAILIES_PAUSED: user.preferences.sleep,
      USER_COSTUME: user.preferences.costume,
      USER_CUSTOM_DAY: user.preferences.dayStart,
      USER_TIMEZONE_OFFSET: user.preferences.timezoneOffset,
      USER_SUBSCRIPTION: user.purchased.plan.planId,
      USER_PAYMENT_PLATFORM: user.purchased.plan.paymentMethod,
      USER_CUSTOMER_ID: user.purchased.plan.customerId,
      USER_CONSECUTIVE_MONTHS: user.purchased.plan.consecutive.count,
      USER_OFFSET_MONTHS: user.purchased.plan.consecutive.offset,
      USER_HOURGLASSES: user.purchased.plan.consecutive.trinkets,
      REPORT_MSG: message,
    };

    const adminMail = nconf.get('ADMIN_EMAIL');

    sendTxn(adminMail, 'report-a-bug', emailData);

    res.status(200).send({
      ok: true,
      emailData,
    });
  },
};

export default api;
