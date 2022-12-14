const mongoose = require('mongoose')
const CustomFieldsSchema = require('./custom_fields_schema')

const FieldsToIgnore = [
  '_id',
  'Status',
  '__v',
  'ID',
  'Department',
  'Requestor',
  'Created At',
  'Updated At',
  'Project Manager',
]

let reqTicket = new mongoose.Schema(
  {
    ID: {
      type: Number,
      required: true
    },
    Status: {
      type: String,
      default: 'New Request',
      enum: [
              'New Request', 
              'Triage',
              'Questionaire Sent', 
              'Review (Requestor)',
              'Review (Director)',
              'On-Hold (Vendor)',
              'In Progress',
              'Completed',
              'n/a'  
            ]
    },
    Requestor: {
      type: mongoose.ObjectId,
      required: true
    },
    'Vendor Name': {
      type: String,
      required: true
    },
    'Project Description': {
      type: String,
      required: true,
    },
    'Project Manager': {
      type: mongoose.Mixed,
      required: true
    },
    'Business Contact': {
      type: String,
      default: '',
      required: true
    },
    Department: {
      type: String,
      required: true,
      enum: [
        'HR',
        'IT',
        'Legal',
        'Manufacturing',
        'Marketing',
        'Ops',
        'Procurement'
      ]
    },
    'Data Sensitivity': {
      type: String,
      required: true,
    },
    'Data Description': {
      type: String,
      required: true
    }, 
    'Data Regulation': {
      type: String,
      required: true,
      default: 'none',
      enum: ['none', 'gxp', 'sox', 'gdpr']
    },
    'Vendor Service': {
      type: String,
      default: '',
      required: true,
    },
    'Submitted To Security': {
      type: Date,
      required: false
    },
    'System Level Access': {
      type: String,
      default: '',
      required: true,
    },
    Platform: {
      type: String,
      default: '',
      required: true,
    },
    'Data Access': {
      type: String,
      default: '',
      required: true
    },
    PHI: {
      type: Boolean,
      required: true,
    },
    'Custom Code Required': {
      type: Boolean,
      required: true,
      default: false
    },
    Integrations: {
      type: Boolean,
      default: true,
    },
    'Need MFA': {
      type: Boolean,
      default: false,
      required: true
    },
    Encryption: {
      type: Boolean,
      default: false,
      required: true
    },
    Attachments: {
      type: Number,
      required: true,
      default: 0
    },
  },
  {timestamps: 
    {
      createdAt: 'Created At', 
      updatedAt: 'Updated At'
    } 
  }
)

const asrTicket = new mongoose.Schema({
    Assessor: {
      type: mongoose.ObjectId,
      required: false,
    },
    'Overall Risk': {
      type: String,
      required: false,
      enum: ['low', 'medium', 'high']
    },
    'Business Risk': {
      type: String,
      required: false,
      enum: ['low', 'medium', 'high']
    },
    
    'Date Completed': {
      type: Date,
      required: false,
    },
    'Due Date': {
      type: Date,
      required: false
    },
    'Warning Date': {
      type: Date,
      required: false,
    },
    'Questionnaire Sent': {
      type: Date,
      required: false
    },
    'Questionnaire Received': {
      type: Date, 
      required: false
    },
    Notes: {
      type: String,
      default: '',
    },
    Timeline: {
      type: String,
      default: 'standard',
      enum: ['standard', 'expedite']
    },
})

let Ticket = new mongoose.Schema()

const UpdateSchema = function(field){
  const SchemaFromField = new mongoose.Schema()
  SchemaFromField.path(field.name,field.fieldType)
  let schemaToAddTo = field.reqOrAsr === "req" ? reqTicket : asrTicket
  schemaToAddTo.add(SchemaFromField)
  schemaToAddTo.path(field.name).required(field.isRequired ? true:false)
  mergeIntoTicket()
}

async function runAtStartUp(){
  const allCustomFields = await CustomFieldsSchema.find()
  if (allCustomFields.length > 0){
    for(field of allCustomFields){
      UpdateSchema(field)
    }
  }
  mergeIntoTicket()
  // console.log(Ticket.paths)
  return;
} runAtStartUp()

function mergeIntoTicket(){
    Ticket.add(reqTicket)
    Ticket.add(asrTicket)
}

const makeModel = function(){
  return mongoose.model('ticket',Ticket)
}
/**
 * takes the current schema, filters out paths that should not be seen by
 * requestors, and reutnrs an array of strings that can be used to
 * filter Ticket options by keys 
 * @returns [pathNames]
 */
async function getRequiredReqSchema(){
  let requiredPaths = []
  await reqTicket.eachPath((name, type) => {
    // console.log(type.isRequired, type.options.required)
    if (FieldsToIgnore.includes(name)){
      return null
    } else {
    let pathObject = {
        name,
        type: type.instance,
        required: type.isRequired,
      }
    if(type.options.enum){
      pathObject['enum'] = type.options.enum
    }
    requiredPaths.push(pathObject)
  }})
  return requiredPaths
}
async function getAsrSchema(){
  let asrPaths = {}
 makeModel()
mergeIntoTicket()
  
  Ticket.eachPath((name, type) => {
  let pathObject = {
          type: type.instance,
          enum: type.options.enum ? type.options.enum : undefined
        }
       
      asrPaths[name]=pathObject
  
})
return asrPaths
}

module.exports = {UpdateSchema, makeModel, getRequiredReqSchema, getAsrSchema, Ticket}