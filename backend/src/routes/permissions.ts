import express from 'express';
import {
  getPermissions,
  setVisibility,
  setDomainRestrictions,
  setAccountPermissions,
  removeAccountPermission
} from '../services/permissions';
import { DomainRestriction, AccountPermission, Visibility } from '../types/permissions';

const router = express.Router();

router.get('/:documentId', (req, res) => {
  const { documentId } = req.params;
  res.json(getPermissions(documentId));
});

router.post('/:documentId/visibility', (req, res) => {
  const { documentId } = req.params;
  const { visibility, actorId } = req.body as { visibility: Visibility; actorId: string };
  res.json(setVisibility(documentId, visibility, actorId));
});

router.post('/:documentId/domains', (req, res) => {
  const { documentId } = req.params;
  const { domains, actorId } = req.body as { domains: DomainRestriction[]; actorId: string };
  res.json(setDomainRestrictions(documentId, domains, actorId));
});

router.post('/:documentId/accounts', (req, res) => {
  const { documentId } = req.params;
  const { accounts, actorId } = req.body as { accounts: AccountPermission[]; actorId: string };
  res.json(setAccountPermissions(documentId, accounts, actorId));
});

router.delete('/:documentId/accounts/:accountId', (req, res) => {
  const { documentId, accountId } = req.params;
  const { actorId } = req.body as { actorId: string };
  res.json(removeAccountPermission(documentId, accountId, actorId));
});

export default router;
