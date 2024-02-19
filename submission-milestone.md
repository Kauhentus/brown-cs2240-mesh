## Mesh (milestone submission)

Please fill this out and submit your work to Gradescope by the milestone deadline.

### Mesh Validator
Describe what your mesh validator checks for here. This can be a list of assertions.

I implemented the halfedge datastructure to store my meshes. My mesh validator function checks for:
1) Every halfedge has a twin, and the twin's twin is the halfedge itself.

2) Every halfedge has a pointer to the vertex it is leaving.
3) Every vertex is attached to a valid halfedge.
4) Every halfedge has a pointer to the face it belongs to.
5) Every face has a pointer to the halfedge it belongs to.

6) Every triangle has three halfedges that point into each other (where you can get back to the start).
7) Double check that we have the right number of halfedges (h) to faces (f) where 3*h must equal f (because each face has its own three halfedges).
8) For every pair of triangles joined by two halfedges, we can walk around the "border" of these two triangles with next and twin pointers to check they are set right.
9) When we delete vertices, make sure they are completely deleted with no pointers pointing to them anymore (i.e. vertices without something referencing are not allowed). 
10) When we delete faces, make sure they are completely deleted with no pointers pointing to them anymore (i.e. every face must have three halfedges pointing to it). 

11) Double check that all the flags the vertex/halfedge data structures contain (which assist traversal / algorithms) are reset so that different mesh operations do not get messed up by ill-set flags.

### Collaboration/References

I referred to the course slides!

### Known Bugs

N/A