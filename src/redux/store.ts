import {createStore} from "redux";


const initialState = {};

export function rootReducer(state = initialState, action:any) {

    if (action.type === "ADD_ENTITY")
    {
        return action.payload
    }

    return state;
}

export function addEntity(payload: any)
{
    return {type: "ADD_ENTITY", payload};
}

export const store = createStore(rootReducer);