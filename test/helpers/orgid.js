const { assertEvent } = require('../helpers/assertions');
const { zeroAddress, zeroBytes } = require('../helpers/constants');

/**
 * Generates an id on the base of string and solt
 * @param {string} string Part of the base for id generation
 * @param {atring} [solt=Math.random().toString()] Solt string
 */
module.exports.generateId = (string, solt = Math.random().toString()) => web3.utils.keccak256(`${string}${solt}`);

/**
 * Creates an organization
 * @param {Object} contract OrgId contract instance
 * @param {string} from Sender address
 * @param {string} uri Link to the json file online
 * @param {string} hash Hash of the json file, should be in bytes32 hex form
 * @returns {Promise<{string}>} The organization address
 */
module.exports.createOrganization = async (
    contract,
    from,
    hash,
    uri
) => {
    const result = await contract
        .methods['createOrganization(bytes32,string,string,string)'](
            hash,
            uri,
            '',
            ''
        )
        .send({ from });
    let organizationId;
    assertEvent(result, 'OrganizationCreated', [
        [
            'orgId',
            p => {
                organizationId = p;
            }
        ],
        [
            'owner',
            p => (p).should.equal(from)
        ]
    ]);

    const org = await contract
        .methods['getOrganization(bytes32)'](organizationId)
        .call();
    (org.orgId).should.equal(organizationId);
    (org.orgJsonUri).should.equal(uri);
    (org.orgJsonHash).should.equal(hash);
    (org.parentOrgId).should.equal(zeroBytes);
    (org.owner).should.equal(from);
    (org.director).should.equal(zeroAddress);
    (org.isActive).should.be.true;
    (org.isDirectorshipAccepted).should.be.false;

    return organizationId;
};

/**
 * Creates the subisidiary
 * @param {Object} contract OrgId contract instance
 * @param {string} from Sender address
 * @param {string} subId Id string that should be conform with bytes32 hex form
 * @param {string} entityDirector The entity director address
 * @param {string} uri Link to the json file online
 * @param {string} hash Hash of the json file, should be in bytes32 hex form
 * @returns {Promise<{string}>} The subsidiary address
 */
module.exports.createUnit = async (
    contract,
    from,
    id,
    subId,
    entityDirector,
    hash,
    uri
) => {
    const result = await contract
        .methods['createUnit(bytes32,address,bytes32,string,string,string)'](
            subId,
            entityDirector,
            hash,
            uri,
            '',
            ''
        )
        .send({ from });
    let organizationId;
    assertEvent(result, 'UnitCreated', [
        [
            'parentOrgId',
            p => (p).should.equal(id)
        ],
        [
            'unitOrgId',
            p => {
                if (id !== zeroBytes) {
                    (p).should.equal(subId);
                }

                organizationId = p;
            }
        ],
        [
            'director',
            p => (p).should.equal(entityDirector)
        ]
    ]);

    if (from === entityDirector) {
        assertEvent(result, 'DirectorshipAccepted', [
            [
                'orgId',
                p => (p).should.equal(organizationId)
            ],
            [
                'director',
                p => (p).should.equal(entityDirector)
            ]
        ]);
    }

    const org = await contract
        .methods['getOrganization(bytes32)'](organizationId)
        .call();
    (org.orgId).should.equal(organizationId);
    (org.orgJsonHash).should.equal(hash);
    (org.orgJsonUri).should.equal(uri);
    (org.orgJsonUriBackup1).should.equal('');
    (org.orgJsonUriBackup2).should.equal('');
    (org.parentOrgId).should.equal(id);
    (org.owner).should.equal(from);
    (org.director).should.equal(entityDirector);
    (org.isActive).should.be.true;
    (org.isDirectorshipAccepted).should.be[(from === entityDirector).toString()];

    return organizationId;
};
