import Express from "express";
import { addNewOffer, AdminSearchAllOffer, deleteOffer, searchAllOffer, updateOffer } from "../controllers/offer.controllers";
import { EditorOnly } from "../middleware/auth.middleware";
import { createOrUpdateOfferStripe, deleteOfferStripe, getOfferStripe } from "../controllers/offerStripe.controller";

const router = Express.Router();

router.get("/", searchAllOffer);
router.get("/adminoffer", AdminSearchAllOffer);
router.get('/offerstripe', getOfferStripe);


router.post("/", EditorOnly, addNewOffer);
router.put("/updateoffer/:id", EditorOnly, updateOffer);
router.delete("/:offerId", EditorOnly, deleteOffer);
router.post('/offerstripe', EditorOnly, createOrUpdateOfferStripe);
router.delete('/offerstripe/:offerId', EditorOnly, deleteOfferStripe);


export default router;
