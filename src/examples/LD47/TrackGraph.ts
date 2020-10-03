import {Util} from "../../Common/Util";


export class Node
{
    constructor(readonly x: number, readonly y: number)
    {
    }
}

class Straight
{
    constructor(readonly n1: Node, readonly n2: Node)
    {
    }
}

export class TrackGraph
{
    nodes: Node[] = [];
    edges: Straight[] = [];
    switches: { control: Node; paths: Node[]; chosen: number }[] = [];

    public next(prevNode: Node, currNode: Node): Node
    {
        // find a way from this node to anything other than the previous node.
        const potential = this.edges.find(x => x.n1 === currNode && x.n2 !== prevNode);

        if (potential !== undefined) return potential.n2;

        // check for switches
        const switchNode = this.switches.find(x => x.control === currNode);

        // TODO this should not happen, unless we are at the end of a path
        if (switchNode === undefined) return currNode;

        return switchNode.paths[switchNode.chosen];
    }

    public connect(node1: Node, node2: Node): void
    {
        this.edges.push(new Straight(node1, node2));
        this.edges.push(new Straight(node2, node1));
    }

    /**
     * Add a list of nodes that will be connected as a sequence.
     * @param nodes
     */
    addSequence(nodes: Node[])
    {
        // Add all nodes to the graph
        this.nodes.push(...nodes);

        // set up the sequence links, bidirectional
        for (let i = 0; i < nodes.length - 1; i++)
        {
            const curr = nodes[i];
            const next = nodes[i + 1];

            this.edges.push(new Straight(curr, next));
            this.edges.push(new Straight(next, curr));
        }
    }

    /**
     * Create a junction between 3 nodes. We assume the nodes are already in the graph.
     */
    createJunction(controlNode: Node, switchNodes: Node[])
    {
        // valid links:
        // control -> switch[0]
        // switch[0] -> control
        // control -> switch[1]
        // switch[1] -> control
        // we can auto connect everything besides the control -> paths
        this.edges.push(new Straight(switchNodes[0], controlNode));
        this.edges.push(new Straight(switchNodes[1], controlNode));

        // remove any existing old backref paths, they are illegal
        const badLinks = this.edges.filter(x => x.n1 === controlNode && switchNodes.includes(x.n2));
        badLinks.forEach(x => Util.remove(this.edges, x));

        // use the switch to control the pathing
        this.switches.push({control: controlNode, paths: switchNodes, chosen: 0});
    }
}
