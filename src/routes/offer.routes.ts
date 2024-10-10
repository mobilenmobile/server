import Express from "express";
import { addNewOffer, AdminSearchAllOffer, deleteOffer, searchAllOffer, updateOffer } from "../controllers/offer.controllers";
import { adminOnly, authenticated } from "../middleware/auth.middleware";
import { createOrUpdateOfferStripe, deleteOfferStripe, getOfferStripe } from "../controllers/offerStripe.controller";

const router = Express.Router();

router.get("/", searchAllOffer);
router.get("/adminoffer", AdminSearchAllOffer);
router.post("/", addNewOffer);
router.put("/updateoffer/:id", adminOnly, updateOffer);
router.delete("/:offerId", deleteOffer);
router.get('/offerstripe', getOfferStripe);
router.post('/offerstripe', createOrUpdateOfferStripe);
router.delete('/offerstripe/:offerId', deleteOfferStripe);

export default router;
