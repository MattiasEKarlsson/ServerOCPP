export default class chargingStation {
    constructor(serialNumber, model, vendorName, firmwareVersion) {
        this.serialNumber = serialNumber;
        this.model = model;
        this.vendorName = vendorName;
        this.firmwareVersion = firmwareVersion;
    }
}