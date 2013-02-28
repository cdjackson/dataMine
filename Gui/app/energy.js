/**
 * dataMine Graphing package for Vera
 * (c) Chris Jackson
 *
var energyCategoryMatrix = [];
var powerWholeHouseId = 0;
var powerWholeHouseValue = 0;

// Build up the array of power consuming devices in each category
function createEnergyCategoryMatrix() {
    energyCategoryMatrix[0] = {};
    energyCategoryMatrix[0].Devices = [];
    energyCategoryMatrix[0].Name = "Unaccounted";
    energyCategoryMatrix[0].Value = 0;
    energyCategoryMatrix[0].Devices[0] = {};
    energyCategoryMatrix[0].Devices[0].Name = "Unknown";
    energyCategoryMatrix[0].Devices[0].Value = 0;


    // Loop through the configuration looking for power variables
    var numDevices = configChan.length;
    for (var iDevice = 0; iDevice < numDevices; ++iDevice) {
        if (configChan[iDevice].EnergyCat != null) {
            var catNum = configChan[iDevice].EnergyCat;
            if (catNum < 2)
                continue;
//if(catNum != 1)
//    continue;
            // Make sure the category exists
            if (energyCategoryMatrix[catNum] == null) {
                energyCategoryMatrix[catNum] = {};
                energyCategoryMatrix[catNum].Name = getEnergyCategory(catNum);
                energyCategoryMatrix[catNum].Devices = [];
                console.debug("addCat=" + energyCategoryMatrix[catNum].Name);
            }

            // Now add the device
            var dev = getVeraDevice(configChan[iDevice].Device);
            energyCategoryMatrix[catNum].Devices[configChan[iDevice].Id] = {};
            energyCategoryMatrix[catNum].Devices[configChan[iDevice].Id].Name = dev.name;
            energyCategoryMatrix[catNum].Devices[configChan[iDevice].Id].Value = parseFloat(configChan[iDevice].LastVal);
            console.debug("addDev=" + energyCategoryMatrix[catNum].Name + " -- " + energyCategoryMatrix[catNum].Devices[configChan[iDevice].Id].Name + " == " + energyCategoryMatrix[catNum].Devices[configChan[iDevice].Id].Value);
        }
    }
}

function updateEnergyCategoryMatrix(updateChan) {
    if (updateChan == null)
        return false;

    var changes = false;

    var chLen = updateChan.length;
    for (var chCnt = 0; chCnt < chLen; chCnt++) {
        if (chVar[chCnt].Id == powerWholeHouseId) {
            powerWholeHouseValue = parseFloat(updateChan[chCnt].LastVal);
            if (energyChartUsageCurrent != null) {
                console.debug("energyChartUsageCurrent(" + powerWholeHouseId + ") =" + powerWholeHouseValue);
                energyChartUsageCurrent.series[0].points[0].update(powerWholeHouseValue);
                changes = true;
            }
            // We're done!
            break;
        }
    }

    if (energyCategoryMatrix.length == 0)
        return changes;

    // Loop through the configuration looking for power variables
    var numDevices = configChan.length;
    var numUpdates = updateChan.length;

    for (var iUpdate = 0; iUpdate < numUpdates; ++iUpdate) {
        // Find the device from its Id
        for (var iDevice = 0; iDevice < numDevices; ++iDevice) {
            if (configChan[iDevice].Id == updateChan[iUpdate].Id) {
                // Is it configured for energy
                if (configChan[iDevice].EnergyCat == null)
                    break;
                var catNum = configChan[iDevice].EnergyCat;
                if (catNum < 2)
                    break;

                if (energyCategoryMatrix[catNum].Devices[updateChan[iUpdate].Id] != null) {
                    energyCategoryMatrix[catNum].Devices[updateChan[iUpdate].Id].Value = parseFloat(updateChan[iUpdate].LastVal);

                    energyChartUsageDonut.series[1].points[energyCategoryMatrix[catNum].Devices[updateChan[iUpdate].Id].Ref].update(energyCategoryMatrix[catNum].Devices[updateChan[iUpdate].Id].Value);
                    changes = true;

                    console.debug("updateChan=" + updateChan[iUpdate].Id + "  catNum=" + catNum + "  =" + updateChan[iUpdate].LastVal + "/" + energyCategoryMatrix[catNum].Devices[updateChan[iUpdate].Id].Value);
                }
                break;
            }
        }
    }

    // Add up all the devices in a category
    var Total = 0;
    for (var listCnt in energyCategoryMatrix) {
//        if(energyCategoryMatrix[listCnt] == null)
//            continue;

        if (listCnt < 2)
            continue;

        energyCategoryMatrix[listCnt].Value = 0;

        var varLen = energyCategoryMatrix[listCnt].Devices.length;
        for (var varCnt in energyCategoryMatrix[listCnt].Devices) {
            energyCategoryMatrix[listCnt].Value += energyCategoryMatrix[listCnt].Devices[varCnt].Value;
        }

        Total += energyCategoryMatrix[listCnt].Value;

        console.debug("catTotal=" + energyCategoryMatrix[listCnt].Name + "=" + energyCategoryMatrix[listCnt].Value);
        energyChartUsageDonut.series[0].points[energyCategoryMatrix[listCnt].Ref].update(energyCategoryMatrix[listCnt].Value);
    }

    console.debug("updateWhole=" + powerWholeHouseValue + "/" + Total);
    // Calculate the difference between the sum of the devices and the "whole house"
    if (powerWholeHouseValue < Total) {
        energyCategoryMatrix[0].Value = 0;
        energyCategoryMatrix[0].Devices[0].Value = 0;
        console.debug("updateUnknown=");
    }
    else {
        energyCategoryMatrix[0].Value = powerWholeHouseValue - Total;
        energyCategoryMatrix[0].Devices[0].Value = powerWholeHouseValue - Total;
        console.debug("updateUnknown=" + energyCategoryMatrix[0].Value + "/" + energyCategoryMatrix[0].Devices[0].Value);
    }
}
 */