// SPDX-FileCopyrightText: 2022 Johannes Loher
//
// SPDX-License-Identifier: MIT

const packageId = "pf2-shields-token-bar";

Hooks.once("ready", () => {
  if (!game.modules.get("lib-wrapper")?.active && game.user.isGM)
    ui.notifications.error(
      `Module ${packageId} requires the 'libWrapper' module. Please install and activate it.`
    );
});

Hooks.once("init", () => {
  libWrapper?.register(
    packageId,
    "CONFIG.Actor.documentClass.prototype.modifyTokenAttribute",
    modifyTokenAttribute,
    "MIXED"
  );

  libWrapper?.register(
    packageId,
    "CONFIG.Token.documentClass.prototype.getBarAttribute",
    getBarAttribute,
    "MIXED"
  );
});

/**
 * @param {Actor['modifyTokenAttribute']} wrapped
 * @param {string} attribute
 * @param {number} value
 * @param {boolean} [isDelta=false]
 * @param {boolean} [isBar=true]
 */
async function modifyTokenAttribute(
  wrapped,
  attribute,
  value,
  isDelta = false,
  isBar = true
) {
  if (attribute === "attributes.shield.hp") {
    const { attributes } = this;
    const actorShield = "shield" in attributes ? attributes.shield : null;
    const shield = (() => {
      const item = this.items.get(actorShield?.itemId ?? "");
      return item?.isOfType("armor") ? item : null;
    })();
    if (!shield) return this;

    if (isDelta)
      value = Math.clamped(
        0,
        Number(shield.hitPoints.value) + value,
        Number(shield.hitPoints.max)
      );

    await shield.update({ "system.hp.value": value });
    return this;
  }
  return wrapped.call(this, attribute, value, isDelta, isBar);
}

/**
 * @param {TokenDocument['getBarAttribute']} wrapped
 * @param {string} barName
 * @param {{alternative?: string}} [options={}]
 */
function getBarAttribute(wrapped, barName, { alternative } = {}) {
  const attr = alternative || this[barName]?.attribute;
  if (!attr || !this.actor) return null;
  const data = foundry.utils.getProperty(this.actor.system, attr);
  if (data === null || data === undefined) return null;
  if (attr === "attributes.shield.hp") {
    return {
      type: "bar",
      attribute: attr,
      value: parseInt(data.value || 0),
      max: parseInt(data.max || 0),
      editable: true,
    };
  }
  return wrapped.call(this, barName, { alternative });
}
