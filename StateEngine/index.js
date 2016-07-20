var StateEngine = function (stateTransitionList,startState,globalCallback) {
    /* stateTransitionList : [ [source , target, callback]] */
    /* globalCallback : function(err,from,to) */
    this.masterCallback = null;
    if (globalCallback) {
        this.masterCallback = globalCallback;
    }

    stateTransitionList.forEach(el => {
        if (el.length === 3 || el.length === 2) {
            this.registerNewState(el[0], el[1], el.length === 3 ? el[2] : null);
        } else {
            throw new Error("Invalid State transitions provided");
        }
        this.currentState = startState;
    });
};

StateEngine.prototype = {
    /* Format : {
        sourceState : {
                target : callbackfunction()
                target2 : callback()
            }
        }
    */
    stateMaster :{},
    constructor: StateEngine,
    currentState: null,
    registerNewState: function (source, target, callback) {
        var targetStates = this.stateMaster[source] ? this.stateMaster[source] : {};
        targetStates[target] = { callback: callback ? callback : null };
        this.stateMaster[source] = targetStates;
    },
    removeState: function (source, target) {
        if (this.stateMaster[source] && this.stateMaster[source][target]) {
            delete this.stateMaster[source][target];
        }
    },
    transition: function (toState) {
        if (this.stateMaster[this.currentState] &&
            this.stateMaster[this.currentState][toState]) {
            var prev = this.currentState;
            this.currentState = toState;
            if (this.stateMaster[prev][toState].callback) {
                this.stateMaster[prev][toState].callback(prev, this.currentState);
            }
            if (this.masterCallback) {
                this.masterCallback(null, prev, this.currentState);
            }
            return true;
        } else {
            if (this.masterCallback) {
                this.masterCallback(new Error("Invalid State Transition"), this.currentState, toState);
            }
            return false;
        }
    },
    syncState : function (state) {
        this.currentState = state;
    }
};

module.exports = StateEngine;